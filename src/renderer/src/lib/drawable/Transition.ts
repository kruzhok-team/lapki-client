import { getBoxToBoxArrow } from 'curved-arrows';

import { State } from './State';

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
        padEnd: 0,
      }
    );

    ctx.beginPath();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
    ctx.stroke();

    ctx.closePath();
  }
}
