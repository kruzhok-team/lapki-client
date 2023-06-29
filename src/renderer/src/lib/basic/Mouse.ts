import { MouseEventEmitter } from '../common/MouseEventEmitter';

enum Button {
  left = 0,
}

export class Mouse extends MouseEventEmitter {
  element!: HTMLElement;

  left: boolean = false;
  pleft: boolean = false;

  private leftOffset = 0;
  private topOffset = 0;

  constructor(element: HTMLElement) {
    super();

    this.element = element;

    this.setOffset();

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
      left: this.left,
      nativeEvent: e,
    };

    this.emit('mousemove', event);
  };

  mousedownHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = true;
    }

    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      left: this.left,
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
      left: this.left,
      nativeEvent: e,
    };

    this.emit('mouseup', event);
  };

  mouseWheelHandler = (e: WheelEvent) => {
    const { x, y } = this.getPosition(e);
    const event = {
      x,
      y,
      left: this.left,
      nativeEvent: e,
    };

    this.emit('wheel', event);
  };

  tick() {
    this.pleft = this.left;
  }
}
