import { Node } from './Node';

import { Container } from '../basic/Container';
import { drawText, prepareText } from '../utils/text';

export class Note extends Node {
  private textData = {
    height: 100,
    textArray: [] as string[],
  };
  private visible = true;

  constructor(container: Container, id: string, parent?: Node) {
    super(container, id, parent);

    this.prepareText();
  }

  get data() {
    return this.container.app.manager.data.elements.notes[this.id];
  }

  get bounds() {
    return { ...this.data.position, width: 200, height: 10 * 2 + this.textData.height };
  }

  set bounds(value) {
    this.data.position.x = value.x;
    this.data.position.y = value.y;
  }

  setVisible(value: boolean) {
    this.visible = value;
    this.container.isDirty = true;
  }

  prepareText() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 9999;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.textData = prepareText(ctx, this.data.text, '16px/1 "Fira Sans"', 200 - 2 * 10);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.visible) return;

    const { x, y, width, height } = this.drawBounds;
    const scale = this.container.app.manager.data.scale;
    const padding = 10 / scale;
    const fontSize = 16 / scale;
    const font = `${fontSize}px/1 'Fira Sans'`;

    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.3;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6 / scale);
    ctx.fill();

    ctx.globalAlpha = 1;

    drawText(ctx, this.textData.textArray, {
      x: x + padding,
      y: y + padding,
      textAlign: 'left',
      color: '#FFF',
      font,
    });

    ctx.closePath();
  }
}
