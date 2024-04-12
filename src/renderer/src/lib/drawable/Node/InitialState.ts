import { Container } from '@renderer/lib/basic';
import { BaseState, icons, Shape } from '@renderer/lib/drawable';
import { getColor } from '@renderer/theme';
import { InitialState as InitialStateData } from '@renderer/types/diagram';

/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorManager, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class InitialState extends BaseState {
  image!: HTMLImageElement;

  constructor(container: Container, id: string, parent?: Shape) {
    super(container, id, parent);
  }

  get data() {
    return this.container.app.manager.data.elements.states[this.id] as InitialStateData;
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
