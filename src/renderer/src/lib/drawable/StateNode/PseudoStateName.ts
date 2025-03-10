import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Point } from '@renderer/lib/types';
import { drawText, getTextWidth } from '@renderer/lib/utils/text';
import theme, { getColor } from '@renderer/theme';

import { Shape } from '../Shape';

/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorModel, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class PseudoStateName extends Shape {
  text: string;

  app: CanvasEditor;
  constructor(app: CanvasEditor, id: string, parent: Shape, text: string) {
    super(app, id, parent);
    this.text = text;
    this.app = app;
  }

  get position(): Point {
    if (!this.parent) return { x: 0, y: 0 };
    return {
      x: this.parent.dimensions.width / 2 - this.dimensions.width / 2,
      y: this.parent.dimensions.height + 5,
    };
  }

  set position(_: Point) {
    // (L140-beep) линтер ругается на пустую строку, но отключение не сработало
    // eslint-disable @typescript-eslint/no-empty-function
  }

  get tooltipText(): string | undefined {
    return undefined;
  }

  get dimensions() {
    if (!this.parent || !this.app.controller.showPseudoStatesName) return { width: 0, height: 0 };
    const { textP, fontSize, fontFamily, lineHeight } = this.style;
    const textWidth =
      getTextWidth(this.text, `${fontSize}px/${lineHeight} '${fontFamily}'`) + textP * 2;
    return {
      width: textWidth,
      height: 30,
    };
  }
  set dimensions(_value) {
    throw new Error('InitialState dimensions are immutable');
  }

  get style() {
    return {
      textP: 5,
      bodyP: 5,
      fontSize: 16,
      lineHeight: 1.2,
      fontFamily: 'Fira Sans',
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.parent || !this.app.controller.showPseudoStatesName) return;

    const { x, y, height, width } = this.drawBounds;
    const textP = this.style.textP / this.app.controller.scale; // паддинг текста внутри метки
    const fontSize = this.style.fontSize / this.app.controller.scale;
    const lineHeight = this.style.lineHeight;
    const fontFamily = this.style.fontFamily;

    ctx.fillStyle = getColor('bg-hover');
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10 / this.app.controller.scale);
    ctx.fill();
    ctx.closePath();

    drawText(ctx, this.text, {
      x: x + textP,
      y: y + textP,
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
