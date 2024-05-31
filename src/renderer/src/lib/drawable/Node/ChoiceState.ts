import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EdgeHandlers } from '@renderer/lib/drawable';
import { Shape } from '@renderer/lib/drawable/Shape';
import theme from '@renderer/theme';

const style = theme.colors.diagram.state;

/**
 * Представление псевдосостояния выбора
 */
export class ChoiceState extends Shape {
  isSelected = false;
  edgeHandlers!: EdgeHandlers;

  constructor(app: CanvasEditor, id: string, parent?: Shape) {
    super(app, id, parent);

    this.edgeHandlers = new EdgeHandlers(this.app, this);
  }

  get data() {
    return this.app.model.data.elements.choiceStates[this.id];
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }

  get dimensions() {
    return { width: 100, height: 100 };
  }
  set dimensions(_value) {
    throw new Error('FinalState does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
    }
  }

  // TODO(bryzZz) Закруглить углы
  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.fillStyle = style.bodyBg;

    ctx.beginPath();

    ctx.moveTo(x + halfWidth, y);
    ctx.lineTo(x + width, y + halfHeight);
    ctx.lineTo(x + halfWidth, y + height);
    ctx.lineTo(x, y + halfHeight);
    ctx.lineTo(x + halfWidth, y);

    ctx.fill();

    ctx.closePath();
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.lineWidth = 2 / this.app.model.data.scale;
    ctx.strokeStyle = '#FFFFFF';

    ctx.beginPath();

    ctx.moveTo(x + halfWidth, y);
    ctx.lineTo(x + width, y + halfHeight);
    ctx.lineTo(x + halfWidth, y + height);
    ctx.lineTo(x, y + halfHeight);
    ctx.lineTo(x + halfWidth, y);

    ctx.stroke();

    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;

    this.edgeHandlers.disabled = value;
  }
}
