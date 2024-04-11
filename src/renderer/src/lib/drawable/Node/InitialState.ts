import { Container } from '@renderer/lib/basic/Container';
import { BaseState } from '@renderer/lib/drawable/Node/BaseState';
import { Shape } from '@renderer/lib/drawable/Shape';
import { drawCircle } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';
import { InitialState as InitialStateData } from '@renderer/types/diagram';

/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorManager, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class InitialState extends BaseState {
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
    return { width: 70, height: 70 };
  }
  set dimensions(_value) {
    throw new Error('InitialState does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = getColor('primary');

    drawCircle(ctx, { x: x + width / 2, y: y + height / 2 }, width / 2);
  }
}
