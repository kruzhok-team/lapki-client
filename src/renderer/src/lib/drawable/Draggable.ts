import { Rectangle } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { isPointInRectangle } from '../utils';

export class Draggable {
  container!: Container;

  bounds!: Rectangle;

  dragging = false;
  private grabOffset = { x: 0, y: 0 };

  onMouseDown: ((node: this) => void) | undefined = undefined;
  onMouseUp: ((node: this) => void) | undefined = undefined;

  constructor(container: Container, bounds: Rectangle) {
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

  handleMouseDown = () => {
    if (!this.container.app.mouse.left) return;

    const isUnderMouse = this.isUnderMouse();

    if (!isUnderMouse) return;

    this.grabOffset = {
      x: this.container.app.mouse.x - this.drawBounds.x,
      y: this.container.app.mouse.y - this.drawBounds.y,
    };
    this.dragging = true;

    if (this.onMouseDown) {
      this.onMouseDown(this);
    }
  };

  handleMouseMove = () => {
    if (!this.dragging || this.container.isPan) return;

    this.bounds.x =
      (this.container.app.mouse.x - this.grabOffset.x) * this.container.scale -
      this.container.offset.x;
    this.bounds.y =
      (this.container.app.mouse.y - this.grabOffset.y) * this.container.scale -
      this.container.offset.y;

    document.body.style.cursor = 'grabbing';

    this.container.app.isDirty = true;
  };

  handleMouseUp = () => {
    const isUnderMouse = this.isUnderMouse();

    if (isUnderMouse) {
      if (this.onMouseUp) {
        this.onMouseUp(this);
      }
    }

    if (!this.dragging) return;

    this.dragging = false;

    document.body.style.cursor = 'default';
  };

  isUnderMouse() {
    return isPointInRectangle(this.drawBounds, {
      x: this.container.app.mouse.x,
      y: this.container.app.mouse.y,
    });
  }
}
