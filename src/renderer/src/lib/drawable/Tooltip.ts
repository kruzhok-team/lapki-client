import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import theme, { getColor } from '@renderer/theme';

import { Point } from '../types';
import { drawText, getTextWidth } from '../utils/text';
/**
 * Класс для отрисовки тултипа
 */
export class Tooltip extends Shape {
  __position: Point = { x: 0, y: 0 };
  text: string;
  constructor(app: CanvasEditor, text: string) {
    super(app, 'tooltip');
    this.text = text;
  }

  get position() {
    return this.__position;
  }

  set position(value) {
    this.__position = value;
  }

  get tooltipText(): string {
    throw new Error('Try to get tooltipText of tooltip');
  }

  get dimensions() {
    return { width: 50, height: 50 };
  }
  set dimensions(_value) {
    throw new Error('InitialState dimensions are immutable');
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, height } = this.drawBounds;
    const p = 15 / this.app.controller.scale;
    const fontSize = 16 / this.app.controller.scale;
    const lineHeight = 1.2;
    const fontFamily = 'Fira Sans';
    ctx.fillStyle = getColor('bg-primary');
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(
      x,
      y,
      getTextWidth(this.text, `${fontSize}px/${lineHeight} '${fontFamily}'`) + p * 2,
      height,
      10 / this.app.controller.scale
    );
    ctx.fill();
    ctx.closePath();

    drawText(ctx, this.text, {
      x: x + p,
      y: y + p,
      textAlign: 'left',
      color: theme.colors.diagram.transition.color,
      font: {
        fontSize,
        fontFamily,
        lineHeight,
      },
    });
    ctx.globalAlpha = 1;
  }
}
