import { Point } from '@renderer/types/graphics';
import { MouseEventEmitter, Button } from '../common/MouseEventEmitter';

/**
 * Обработчик событий, связанных со взаимодействием мыши и {@link Canvas}.
 * Оборачивает браузерные события, происходящие на холсте, и пересчитывает
 * координаты мыши относительно холста.
 */
export class Mouse extends MouseEventEmitter {
  element!: HTMLElement;

  left = false;
  pleft = false;

  px = 0;
  py = 0;

  private leftOffset = 0;
  private topOffset = 0;

  constructor(element: HTMLElement) {
    super();

    this.element = element;

    this.element.addEventListener('contextmenu', this.rightClickHandler);
    this.element.addEventListener('dblclick', this.doubleClickHandler);
    this.element.addEventListener('mousedown', this.mousedownHandler);
    this.element.addEventListener('mouseup', this.mouseupHandler);
    this.element.addEventListener('mousemove', this.mousemoveHandler);
    this.element.addEventListener('wheel', this.mouseWheelHandler);
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
      button: e.button,
      nativeEvent: e,
    };

    this.emit('mousemove', event);

    this.px = x;
    this.py = y;
  };

  mousedownHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = true;
    }

    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('mousedown', event);
  };

  mouseupHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = false;
    }

    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('mouseup', event);
  };

  doubleClickHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = false;
    }

    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      button: e.button,
      nativeEvent: e,
    };
    this.emit('dblclick', event);
  };

  rightClickHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = false;
    }

    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      button: e.button,
      nativeEvent: e,
    };
    this.emit('contextmenu', event);
  };

  mouseWheelHandler = (e: WheelEvent) => {
    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      dx: x - this.px,
      dy: y - this.py,
      left: this.left,
      button: e.button,
      nativeEvent: e,
    };

    this.emit('wheel', event);
  };

  tick() {
    this.pleft = this.left;
  }
}
