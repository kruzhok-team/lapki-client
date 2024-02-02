import { Node } from './Node';

import { Container } from '../basic/Container';

export class Note extends Node {
  constructor(container: Container, id: string, parent?: Node) {
    super(container, id, parent);
  }

  get data() {
    return this.container.app.manager.data.elements.notes[this.id];
  }

  get bounds() {
    return { ...this.data.position, width: 130, height: 70 };
  }

  set bounds(value) {
    this.data.position.x = value.x;
    this.data.position.y = value.y;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { x, y, width, height } = this.bounds;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height);
    ctx.closePath();
  }
}
