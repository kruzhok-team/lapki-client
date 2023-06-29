import { Rectangle } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { isPointInRectangle } from '../utils';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';

// interface MyMouseEvent<T> {
//   target: T;
//   event: any;
// }

export class Draggable extends EventEmitter {
  container!: Container;

  bounds!: Rectangle;

  dragging = false;
  private grabOffset = { x: 0, y: 0 };

  private isMouseDown = false;

  // onMouseDown?: (event: MyMouseEvent<this>) => void;
  // onMouseUp?: (event: MyMouseEvent<this>) => void;
  // onClick?: (event: MyMouseEvent<this>) => void;

  constructor(container: Container, bounds: Rectangle) {
    super();

    this.container = container;
    this.bounds = bounds;

    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousedown', this.handleMouseDown);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);
  }

  get drawBounds(): Rectangle {
    return {
      x: (this.bounds.x + this.container.offset.x) / this.container.scale,
      y: (this.bounds.y + this.container.offset.y) / this.container.scale,
      width: this.bounds.width / this.container.scale,
      height: this.bounds.height / this.container.scale,
    };
  }

  handleMouseDown = (e: MyMouseEvent) => {
    if (!e.left) return;

    const isUnderMouse = this.isUnderMouse(e);

    if (!isUnderMouse) return;

    // для того что-бы не хватать несколько элементов
    e.stopPropagation();

    this.grabOffset = {
      x: e.x - this.drawBounds.x,
      y: e.y - this.drawBounds.y,
    };
    this.dragging = true;

    this.isMouseDown = true;

    this.emit('mousedown', { event: e, target: this });

    // this.onMouseDown?.({ event, target: this });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.dragging || this.container.isPan) return;

    this.bounds.x = (e.x - this.grabOffset.x) * this.container.scale - this.container.offset.x;
    this.bounds.y = (e.y - this.grabOffset.y) * this.container.scale - this.container.offset.y;

    document.body.style.cursor = 'grabbing';

    this.container.app.isDirty = true;
  };

  handleMouseUp = (e: MyMouseEvent) => {
    const isUnderMouse = this.isUnderMouse(e);

    if (!isUnderMouse) return;

    this.dragging = false;

    document.body.style.cursor = 'default';

    this.emit('mousedown', { event: e, target: this });
    // this.onMouseUp?.({ event, target: this });

    if (this.isMouseDown) {
      this.isMouseDown = false;

      this.emit('click', { event: e, target: this });

      // this.onClick?.({ event, target: this });
    }
  };

  isUnderMouse({ x, y }: MyMouseEvent) {
    console.log(this.drawBounds, { x, y });

    return isPointInRectangle(this.drawBounds, { x, y });
  }
}
