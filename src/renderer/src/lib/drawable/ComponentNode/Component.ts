import { CanvasScheme } from '@renderer/lib/CanvasScheme';
import { Shape } from '@renderer/lib/drawable/Shape';
import { stateStyle, transitionStyle } from '@renderer/lib/styles';
/**
 * Представление компонента в схемотехническом экране
 */
export class Component extends Shape {
  isSelected = false;

  constructor(app: CanvasScheme, id: string, parent?: Shape) {
    super(app, id, parent);
  }
  get data() {
    console.log(this.app.controller.model.data.elements.components[this.id]);
    return this.app.controller.model.data.elements.components[this.id];
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }

  get dimensions() {
    return { width: 150, height: 100 };
  }
  set dimensions(_value) {
    throw new Error('Components does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  // TODO(bryzZz) Закруглить углы
  private drawBody(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform;

    if (!platform) return;

    const { x, y, width, height } = this.drawBounds;
    const fontSize = stateStyle.titleFontSize / this.app.controller.model.data.scale;

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;
    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.app.controller.model.data.scale);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.lineWidth = 2 / this.app.controller.model.data.scale;
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
  }
}
