import { getBoxToBoxArrow } from 'curved-arrows';

import { State } from './State';

interface TransitionArgs {
  source: State;
  target: State;
}

export class Transition {
  source!: State | null;
  target!: State | null;

  // isGhost = false;
  // ghostTarget: { x: number; y: number } | null = null;

  constructor(args?: TransitionArgs) {
    if (args) {
      this.source = args.source as State;
      this.target = args.target as State;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    ghostTarget?: { x: number; y: number }
  ) {
    if (ghostTarget && this.source) {
      ctx.beginPath();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFF';

      const cx = this.source.bounds.x + this.source.bounds.width / 2;
      const cy = this.source.bounds.y + this.source.bounds.height / 2;

      ctx.moveTo(cx, cy);
      ctx.lineTo(ghostTarget.x, ghostTarget.y);
      ctx.stroke();

      ctx.closePath();

      return;
    }

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
