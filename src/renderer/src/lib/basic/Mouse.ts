import { Point } from '@renderer/types/graphics';
import { Button, MouseEvents } from '@renderer/types/mouse';

import { BubbleEventEmitter } from '../common/BubbleEventEmitter';

/**
 * Обработчик событий, связанных со взаимодействием мыши и {@link Canvas}.
 * Оборачивает браузерные события, происходящие на холсте, и пересчитывает
 * координаты мыши относительно холста.
 */
export class Mouse extends BubbleEventEmitter<MouseEvents> {
  element!: HTMLElement;

  left = false;
  pleft = false;
  right = false;

  px = 0;
  py = 0;

  private leftOffset = 0;
  private topOffset = 0;

  private isMovedWithRightMouseDown = false;

  constructor(element: HTMLElement) {
    super();

    this.element = element;

    this.element.addEventListener('dblclick', this.doubleClickHandler);
    this.element.addEventListener('mousedown', this.mousedownHandler);
    this.element.addEventListener('mouseup', this.mouseupHandler);
    this.element.addEventListener('mousemove', this.mousemoveHandler);
    this.element.addEventListener('wheel', this.mouseWheelHandler);
  }

  clearUp() {
    this.element.removeEventListener('dblclick', this.doubleClickHandler);
    this.element.removeEventListener('mousedown', this.mousedownHandler);
    this.element.removeEventListener('mouseup', this.mouseupHandler);
    this.element.removeEventListener('mousemove', this.mousemoveHandler);
    this.element.removeEventListener('wheel', this.mouseWheelHandler);
  }

  setOffset() {
    const bounds = this.element.getBoundingClientRect();
    this.leftOffset = bounds.left;
    this.topOffset = bounds.top;
  }

  getOffset(): Point {
    return { x: this.leftOffset, y: this.topOffset };
  }

  getPosition(e: MouseEvent) {
    const { clientX, clientY } = e;

    return {
      x: clientX - this.leftOffset,
      y: clientY - this.topOffset,
    };
  }

  mousemoveHandler = (e: MouseEvent) => {
    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      right: this.right,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('mousemove', event);

    if (this.right) this.isMovedWithRightMouseDown = true;

    this.px = x;
    this.py = y;
  };

  mousedownHandler = (e: MouseEvent) => {
    if (e.button === Button.left) this.left = true;
    if (e.button === Button.right) this.right = true;

    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      right: this.right,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('mousedown', event);
  };

  mouseupHandler = (e: MouseEvent) => {
    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      right: this.right,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('mouseup', event);

    if (this.right && !this.isMovedWithRightMouseDown) this.emit('rightclick', event);

    this.left = false;
    this.right = false;
    this.isMovedWithRightMouseDown = false;
  };

  doubleClickHandler = (e: MouseEvent) => {
    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      right: this.right,
      button: e.button,
      nativeEvent: e,
    };
    this.emit('dblclick', event);
  };

  mouseWheelHandler = (e: WheelEvent) => {
    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      right: this.right,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('wheel', event);
  };

  tick() {
    this.pleft = this.left;
  }
}
