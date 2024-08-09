import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import { drawCircle } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';

/**
 * Класс для отрисовки конечного состояния
 */
export class FinalState extends Shape {
  constructor(app: CanvasEditor, id: string, parent?: Shape) {
    super(app, id, parent);
  }

  get data() {
    return this.app.controller.model.data.elements.finalStates[this.id];
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
    throw new Error('FinalState does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;
    const radius = width / 2;
    const position = { x: x + radius, y: y + radius };

    drawCircle(ctx, {
      position,
      radius: radius - 10 / this.app.controller.model.data.scale,
      fillStyle: getColor('primary'),
    });
    drawCircle(ctx, {
      position,
      radius,
      lineWidth: 3 / this.app.controller.model.data.scale,
      strokeStyle: getColor('primary'),
    });
  }
}
