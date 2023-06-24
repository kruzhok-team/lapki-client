import { Rectangle } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { isPointInRectangle } from '../utils';

export class Draggable {
  container!: Container;

  innerBounds!: Rectangle;

  dragging = false;
  private grabOffset = { x: 0, y: 0 };

  onMouseDown: ((node: this) => void) | undefined = undefined;
  onMouseUp: ((node: this) => void) | undefined = undefined;

  constructor(container: Container, bounds: Rectangle) {
    this.container = container;
    this.innerBounds = bounds;

    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousedown', this.handleMouseDown);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);
  }

  get bounds(): Rectangle {
    return {
      x: this.innerBounds.x + this.container.offset.x,
      y: this.innerBounds.y + this.container.offset.y,
      width: this.innerBounds.width,
      height: this.innerBounds.height,
    };
  }

  handleMouseDown = () => {
    if (!this.container.app.mouse.left) return;

    const isUnderMouse = this.isUnderMouse();

    if (!isUnderMouse) return;

    this.grabOffset = {
      x: this.container.app.mouse.x - this.innerBounds.x,
      y: this.container.app.mouse.y - this.innerBounds.y,
    };
    this.dragging = true;

    if (this.onMouseDown) {
      this.onMouseDown(this);
    }
  };

  handleMouseMove = () => {
    if (!this.dragging || this.container.isPan) return;

    this.innerBounds.x = this.container.app.mouse.x - this.grabOffset.x - this.container.offset.x;
    this.innerBounds.y = this.container.app.mouse.y - this.grabOffset.y - this.container.offset.y;

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
    return isPointInRectangle(this.innerBounds, {
      x: this.container.app.mouse.x,
      y: this.container.app.mouse.y,
    });
  }
}
