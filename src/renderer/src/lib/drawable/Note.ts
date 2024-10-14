import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EdgeHandlers, Shape } from '@renderer/lib/drawable';
import { drawText, prepareText } from '@renderer/lib/utils/text';
import { getColor } from '@renderer/theme';
import { Note as DataNote } from '@renderer/types/diagram';

const placeholder = 'Придумайте заметку';

/**
 * Класс который отрисовывает данные заметки
 */
export class Note extends Shape {
  private textData = {
    height: 100,
    textArray: [] as string[],
    hasText: false,
  };
  private visible = true;
  isSelected = false;
  edgeHandlers!: EdgeHandlers;
  data: DataNote;

  constructor(app: CanvasEditor, id: string, data: DataNote, parent?: Shape) {
    super(app, id, parent);
    this.data = data;
    this.prepareText();
    this.edgeHandlers = new EdgeHandlers(this.app as CanvasEditor, this);
  }

  get bounds() {
    return { ...this.data.position, width: 200, height: 10 * 2 + this.textData.height };
  }

  set bounds(value) {
    this.data.position.x = value.x;
    this.data.position.y = value.y;
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }
  get dimensions() {
    return { width: 200, height: 10 * 2 + this.textData.height };
  }
  set dimensions(_value) {
    throw new Error('Note dimensions are immutable');
  }

  get computedStyles() {
    const scale = this.app.controller.scale;

    return {
      padding: 10 / scale,
      fontSize: (this.data.fontSize ?? 16) / scale,
      borderRadius: 6 / scale,
      color: this.textData.hasText
        ? this.data?.textColor ?? getColor('text-primary')
        : getColor('border-primary'),
    };
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;

    this.edgeHandlers.disabled = value;
  }

  /**
   * Не рекомендуется делать это в обход контроллера
   */
  setVisible(value: boolean) {
    this.visible = value;
  }

  prepareText() {
    const hasText = Boolean(this.data.text);

    this.textData = {
      ...prepareText(this.data.text || placeholder, 200 - 2 * 10, {
        fontSize: this.data.fontSize ?? 16,
        lineHeight: hasText ? 1.2 : 1,
        fontFamily: 'Fira Sans',
      }),
      hasText,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.visible) return;

    const { x, y, width, height } = this.drawBounds;
    const textToDraw = this.textData.hasText ? this.textData.textArray : placeholder;
    const { padding, fontSize, color, borderRadius } = this.computedStyles;

    ctx.fillStyle = this.data.backgroundColor ?? getColor('bg-primary');

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.fill();

    drawText(ctx, textToDraw, {
      x: x + padding,
      y: y + padding,
      textAlign: 'left',
      color,
      font: {
        fontSize,
        lineHeight: this.textData.hasText ? 1.2 : 1,
        fontFamily: 'Fira Sans',
      },
    });

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
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
