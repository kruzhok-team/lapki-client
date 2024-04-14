import { EditorView } from '@renderer/lib/basic';
import { icons } from '@renderer/lib/drawable';
import { Shape } from '@renderer/lib/drawable/Shape';
import { getColor } from '@renderer/theme';

/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorModel, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class InitialState extends Shape {
  image!: HTMLImageElement;

  constructor(view: EditorView, id: string, parent?: Shape) {
    super(view, id, parent);
  }

  get data() {
    return this.view.app.model.data.elements.initialStates[this.id];
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }

  get dimensions() {
    return { width: 60, height: 60 };
  }
  set dimensions(_value) {
    throw new Error('InitialState does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D) {
    const icon = icons.get('InitialStateIcon');
    if (!icon) return;

    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = getColor('primary');

    ctx.beginPath();

    ctx.save();
    ctx.arc(x + width / 2, y + height / 2, width / 2, 0, 2 * Math.PI);
    ctx.clip();
    // drawCircle(ctx, { x: x + width / 2, y: y + height / 2 }, width / 2);

    ctx.drawImage(icon, x, y, width, height);
    ctx.restore();

    ctx.closePath();
  }
}
