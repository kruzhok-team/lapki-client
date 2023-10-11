import { Draggable } from './Draggable';
import { State } from './State';

import { Container } from '../basic/Container';
import { getLine } from '../utils';

export class InitialStateMark extends Draggable {
  sourceId: string | null = null;
  position = { x: 0, y: 0 };

  constructor(container: Container) {
    super(container, 'InitialStateMark');
  }

  get bounds() {
    return { ...this.position, width: 130, height: 70 };
  }

  set bounds(value) {
    console.log(value);

    this.position.x = value.x;
    this.position.y = value.y;
  }

  get state() {
    if (!this.sourceId) return null;

    return this.container.machine.states.get(this.sourceId) ?? null;
  }

  setState(state: State) {
    this.sourceId = state.id;
    this.position = {
      x: state.data.bounds.x - 100,
      y: state.data.bounds.y - 100,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.state) return;

    const { x, y, width, height } = this.drawBounds;

    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.container.app.manager.data.scale);
    ctx.stroke();

    ctx.fillText('Начало', x, y);

    ctx.closePath();

    const { start, mid, end } = getLine(this.drawBounds, this.state.drawBounds, 10, 3, 3);

    const rounded = 12 / this.container.app.manager.data.scale; // нет защиты на максимальный радиус, так что просто его не ставь!

    ctx.beginPath();

    ctx.moveTo(start.x, start.y);

    // просто отступаем на радиус в обе стороны и рисуем дугу между этими двумя точками
    if (mid) {
      const p1x = mid.x - (start.x < mid.x ? rounded : -rounded);
      const p1y = mid.y;
      const p2x = mid.x;
      const p2y = mid.y - (end.y < mid.y ? rounded : -rounded);

      ctx.lineTo(p1x, p1y);

      ctx.bezierCurveTo(p1x, p1y, mid.x, mid.y, p2x, p2y);
    }
    ctx.lineTo(end.x, end.y);

    ctx.stroke();

    ctx.closePath();
  }
}
