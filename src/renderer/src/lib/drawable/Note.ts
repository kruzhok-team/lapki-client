import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable';
import { drawText, prepareText } from '@renderer/lib/utils/text';
import { getColor } from '@renderer/theme';

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

  constructor(app: CanvasEditor, id: string, parent?: Shape) {
    super(app, id, parent);

    this.prepareText();
  }

  get data() {
    return this.app.model.data.elements.notes[this.id];
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
    const scale = this.app.model.data.scale;

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

  /**
   * Не рекомендуется делать это в обход контроллера
   */
  setVisible(value: boolean) {
    this.visible = value;
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

  draw(ctx: CanvasRenderingContext2D) {
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
