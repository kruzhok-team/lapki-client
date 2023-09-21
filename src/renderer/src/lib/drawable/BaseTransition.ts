import { Point, TransitionLine } from '@renderer/types/graphics';
import { transitionStyle } from '../styles';
import { rotatePoint } from '../utils';
import { Container } from '../basic/Container';

export class BaseTransition {
  container!: Container;

  constructor(container: Container) {
    this.container = container;
  }

  protected drawLine(ctx: CanvasRenderingContext2D, line: TransitionLine) {
    const { start, mid, end } = line;
    const rounded = 10; // нет защиты на максимальный радиус, так что просто его не ставь!

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

  protected drawStart(ctx: CanvasRenderingContext2D, position: Point) {
    ctx.beginPath();

    ctx.arc(
      position.x,
      position.y,
      transitionStyle.startSize / this.container.app.manager.data.scale,
      0,
      2 * Math.PI
    );
    ctx.fill();

    ctx.closePath();
  }

  protected drawEnd(ctx: CanvasRenderingContext2D, position: Point, angle: number) {
    const width = 10 / this.container.app.manager.data.scale;
    const height = 10 / this.container.app.manager.data.scale;

    const p1 = rotatePoint({ x: position.x - width, y: position.y - height / 2 }, position, angle);
    const p2 = rotatePoint({ x: position.x - width, y: position.y + height / 2 }, position, angle);

    ctx.beginPath();

    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(position.x, position.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p1.x, p1.y);

    ctx.fill();

    ctx.closePath();
  }
}
