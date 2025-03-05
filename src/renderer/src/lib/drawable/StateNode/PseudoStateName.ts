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
    return { x: 0, y: 0 };
  }
  set position(_: Point) {
    throw new Error('No message');
  }

  get tooltipText(): string | undefined {
    return undefined;
  }

  get dimensions() {
    const { fontSize, fontFamily, textP, lineHeight } = this.style;
    const textWidth =
      getTextWidth(this.text, `${fontSize}px/${lineHeight} '${fontFamily}'`) + textP * 2;
    return { width: textWidth, height: 30 };
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
    if (!this.parent) return;

    const { x, y, height, width } = this.parent.drawBounds;
    const labelH = 30 / this.app.controller.scale;
    const textP = 5 / this.app.controller.scale; // паддинг текста внутри метки
    const bodyP = 5 / this.app.controller.scale; // паддинг метки от родителя
    const fontSize = 16 / this.app.controller.scale;
    const lineHeight = 1.2;
    const fontFamily = 'Fira Sans';
    const textWidth =
      getTextWidth(this.text, `${fontSize}px/${lineHeight} '${fontFamily}'`) + textP * 2;
    const labelX = x + width / 2 - textWidth / 2;
    const labelY = y + height + bodyP;
    ctx.fillStyle = getColor('bg-hover');
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, textWidth, labelH, 10 / this.app.controller.scale);
    ctx.fill();
    ctx.closePath();

    drawText(ctx, this.text, {
      x: labelX + textP,
      y: labelY + textP,
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
