import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import { drawCircle } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';
import { InitialState as DataInitialState } from '@renderer/types/diagram';
/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorModel, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class InitialState extends Shape {
  data: DataInitialState;
  constructor(app: CanvasEditor, id: string, data: DataInitialState, parent?: Shape) {
    super(app, id, parent);
    this.data = data;
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
    throw new Error('InitialState dimensions are immutable');
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;
    const radius = width / 2;
    const position = { x: x + radius, y: y + radius };

    drawCircle(ctx, {
      position,
      radius,
      fillStyle: getColor('primary'),
    });
  }
}
