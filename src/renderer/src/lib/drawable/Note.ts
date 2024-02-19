import { getColor } from '@renderer/theme';

import { Node } from './Node';

import { Container } from '../basic/Container';
import { drawText, prepareText } from '../utils/text';

const placeholder = 'Придумайте заметку';

export class Note extends Node {
  private textData = {
    height: 100,
    textArray: [] as string[],
    hasText: false,
  };
  private visible = true;
  isSelected = false;

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

  get computedStyles() {
    const scale = this.container.app.manager.data.scale;

    return {
      padding: 10 / scale,
      fontSize: 16 / scale,
      borderRadius: 6 / scale,
      color: this.textData.hasText ? getColor('text-primary') : getColor('border-primary'),
    };
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
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
    this.textData = {
      ...prepareText(ctx, this.data.text || placeholder, '16px/1 "Fira Sans"', 200 - 2 * 10),
      hasText: Boolean(this.data.text),
    };
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (!this.visible) return;

    const { x, y, width, height } = this.drawBounds;
    const textToDraw = this.textData.hasText ? this.textData.textArray : placeholder;
    const { padding, fontSize, color, borderRadius } = this.computedStyles;
    const font = `${fontSize}px/1 'Fira Sans'`;

    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.3;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.fill();

    ctx.globalAlpha = 1;

    drawText(ctx, textToDraw, {
      x: x + padding,
      y: y + padding,
      textAlign: 'left',
      color,
      font,
    });

    if (this.isSelected) {
      this.drawSelection(ctx);
    }

    ctx.closePath();
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const { borderRadius } = this.computedStyles;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();
  }
}
