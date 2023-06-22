import { getBoxToBoxArrow } from 'curved-arrows';

import { State } from './State';
import { Vector2D } from '@renderer/types/graphics';
import { rotatePoint } from '../utils';

interface TransitionArgs {
  source: State;
  target: State;
}

export class Transition {
  source!: State | null;
  target!: State | null;

  constructor(args: TransitionArgs) {
    this.source = args.source;
    this.target = args.target;
  }

  private drawTriangle(
    ctx: CanvasRenderingContext2D,
    origin: Vector2D,
    width: number,
    height: number,
    angle: number
  ) {
    const p1 = rotatePoint({ x: origin.x - width, y: origin.y - height / 2 }, origin, angle);
    const p2 = rotatePoint({ x: origin.x - width, y: origin.y + height / 2 }, origin, angle);

    ctx.beginPath();

    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(origin.x, origin.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p1.x, p1.y);

    ctx.fill();

    ctx.closePath();
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.source || !this.target) return;

    const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrow(
      this.source.bounds.x,
      this.source.bounds.y,
      this.source.bounds.width,
      this.source.bounds.height,
      this.target.bounds.x,
      this.target.bounds.y,
      this.target.bounds.width,
      this.target.bounds.height,
      {
        padEnd: 5,
      }
    );

    ctx.beginPath();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    const origin = { x: ex, y: ey };
    if (ae === 0) {
      origin.x += 11;
    } else if (ae === 90) {
      origin.y += 11;
    } else if (ae === 180) {
      origin.x -= 11;
    } else if (ae === 270) {
      origin.y -= 11;
    }

    this.drawTriangle(ctx, origin, 11, 11, (ae * Math.PI) / 180);
  }
}
