import { getColor } from '@renderer/theme';

import { Node } from './Node';

import { Container } from '../basic/Container';
import { transitionStyle } from '../styles';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawText,
  drawTriangle,
  getLine,
} from '../utils';

export class InitialStateMark extends Node {
  position = { x: 0, y: 0 };

  constructor(container: Container, public sourceId: string) {
    super(container, 'InitialStateMark');

    if (!this.state) return;

    this.position = {
      x: this.state.compoundPosition.x - 100,
      y: this.state.compoundPosition.y - 100,
    };
  }

  get bounds() {
    return { ...this.position, width: 130, height: 70 };
  }

  set bounds(value) {
    this.position.x = value.x;
    this.position.y = value.y;
  }

  get state() {
    return this.container.machine.states.get(this.sourceId) ?? null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.state) return;

    const { x, y, width, height } = this.drawBounds;

    ctx.lineWidth = 2;
    ctx.fillStyle = getColor('primary');

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6 / this.container.app.manager.data.scale);
    ctx.fill();

    drawText(ctx, 'Начало', {
      x: x + width / 2,
      y: y + height / 2,
      color: '#FFF',
      align: 'center',
      baseline: 'middle',
      fontWeight: 'bold',
      fontSize: 24 / this.container.app.manager.data.scale,
    });

    const line = getLine(this.state.drawBounds, this.drawBounds, 10, 3, 3);

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
