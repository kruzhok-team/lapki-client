import { EventEmitter } from '../common/EventEmitter';

enum Button {
  left = 0,
}

export class Mouse extends EventEmitter<MouseEvent> {
  element!: HTMLElement;

  under: boolean = false;
  punder: boolean = false;

  x: number = 0;
  y: number = 0;

  private px: number = 0;
  private py: number = 0;

  dx: number = 0;
  dy: number = 0;

  left: boolean = false;
  pleft: boolean = false;

  mousedownStack: string[] = [];

  constructor(element: HTMLElement) {
    super();

    this.element = element;

    this.element.addEventListener('mousemove', this.mousemoveHandler);
    this.element.addEventListener('mouseleave', this.mouseleaveHandler);
    this.element.addEventListener('mouseenter', this.mousemoveHandler);
    this.element.addEventListener('mousedown', this.mousedownHandler);
    this.element.addEventListener('mouseup', this.mouseupHandler);
  }

  mousemoveHandler = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top } = this.element.getBoundingClientRect();

    const x = clientX - left;
    const y = clientY - top;

    Object.assign(this, { x, y, px: this.x, py: this.y, under: true });

    this.emit('mousemove', e);
  };

  mouseleaveHandler = (e: MouseEvent) => {
    this.under = false;

    this.emit('mouseleave', e);
  };

  mousedownHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = true;
    }

    this.emit('mousedown', e);
  };

  mouseupHandler = (e: MouseEvent) => {
    if (e.button === Button.left) {
      this.left = false;
    }

    this.emit('mouseup', e);
  };

  tick() {
    Object.assign(this, {
      dx: this.x - this.px,
      dy: this.y - this.py,
      px: this.x,
      py: this.y,
      pleft: this.left,
      punder: this.under,
    });
  }
}
