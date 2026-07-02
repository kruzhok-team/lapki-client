import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EdgeHandlers } from '@renderer/lib/drawable';
import { Shape } from '@renderer/lib/drawable/Shape';
import { drawCircle } from '@renderer/lib/utils';
import { drawText } from '@renderer/lib/utils/text';
import { getColor } from '@renderer/theme';
import { DeepHistory as DataDeepHistory } from '@renderer/types/diagram';

/**
 * Представление псевдосостояния глубокой истории
 */
export class DeepHistory extends Shape {
  isSelected = false;
  edgeHandlers!: EdgeHandlers;
  data: DataDeepHistory;
  smId: string;
  constructor(app: CanvasEditor, id: string, smId: string, data: DataDeepHistory, parent?: Shape) {
    super(app, id, parent);
    this.data = data;
    this.smId = smId;
    this.edgeHandlers = new EdgeHandlers(this.app as CanvasEditor, this);
  }

  get tooltipText() {
    return 'Глубокая история';
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }

  get dimensions() {
    return { width: 50, height: 50 };
  }
  set dimensions(_value) {
    throw new Error('DeepHistory does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;
    const radius = width / 2;
    const position = { x: x + radius, y: y + radius };
    const lineWidth = 3 / this.app.controller.scale;

    drawCircle(ctx, {
      position,
      radius,
      lineWidth,
      strokeStyle: getColor('error'),
    });

    const textFont = 40 / this.app.controller.scale;

    drawText(ctx, 'H', {
      x: position.x - textFont * 0.05,
      y: position.y - textFont / 2 - lineWidth * 3,
      textAlign: 'center',
      color: getColor('error'),
      font: {
        fontSize: textFont,
        fontFamily: 'Fira Sans',
      },
    });

    const symbolFont = 24 / this.app.controller.scale;

    drawText(ctx, '*', {
      x: position.x + symbolFont * 0.6,
      y: position.y - symbolFont * 0.95,
      textAlign: 'center',
      color: getColor('error'),
      font: {
        fontSize: symbolFont,
        fontFamily: 'Fira Sans',
      },
    });
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;
    const radius = width / 2;
    const position = { x: x + radius, y: y + radius };
    const lineWidth = 2 / this.app.controller.scale;
    drawCircle(ctx, {
      position,
      radius: radius + lineWidth,
      lineWidth,
      strokeStyle: '#FFFFFF',
    });
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;

    this.edgeHandlers.disabled = value;
  }
}
