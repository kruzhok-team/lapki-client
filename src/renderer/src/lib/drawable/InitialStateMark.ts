import { getColor } from '@renderer/theme';

import { Node } from './Node';

import { Container } from '../basic/Container';
import { transitionStyle } from '../styles';
import { degrees_to_radians, drawCircle, drawCurvedLine, drawTriangle, getLine } from '../utils';
import { drawText } from '../utils/text';

/**
 * Класс для отрисовки начального состояния
 * плотно завязан на данные в EditorManager, то есть
 * данные на момент создания этого класса уже должны существовать
 */
export class InitialStateMark extends Node {
  constructor(container: Container) {
    super(container, 'InitialStateMark');
  }

  get data() {
    return this.container.app.manager.data.elements.initialState;
  }

  get bounds() {
    return { ...this.data!.position, width: 130, height: 70 };
  }

  set bounds(value) {
    this.data!.position.x = value.x;
    this.data!.position.y = value.y;
  }

  get target() {
    return this.container.machineController.states.get(this.data!.target) ?? null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.target) return;

    const { x, y, width, height } = this.drawBounds;
    const fontSize = 24 / this.container.app.manager.data.scale;

    ctx.fillStyle = getColor('primary');

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6 / this.container.app.manager.data.scale);
    ctx.fill();

    drawText(ctx, 'Начало', {
      x: x + width / 2,
      y: y + height / 2,
      fontWeight: 'bold',
      fontSize,
      lineHeight: 1,
      fontFamily: 'Fira Sans',
      color: '#FFF',
      textAlign: 'center',
      textBaseline: 'middle',
    });

    const line = getLine(this.target.drawBounds, this.drawBounds, 10, 3, 3);

    const rounded = 12 / this.container.app.manager.data.scale; // нет защиты на максимальный радиус, так что просто его не ставь!
    ctx.strokeStyle = getColor('text-primary');
    ctx.fillStyle = getColor('text-primary');

    drawCurvedLine(ctx, line, rounded);
    drawCircle(ctx, line.end, transitionStyle.startSize / this.container.app.manager.data.scale);
    drawTriangle(
      ctx,
      line.start,
      10 / this.container.app.manager.data.scale,
      degrees_to_radians(line.se)
    );

    ctx.closePath();
  }
}
