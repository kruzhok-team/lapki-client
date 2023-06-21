import { getBoxToBoxArrow } from 'curved-arrows';

import { Transition as TransitionType } from '../../types';
import { CanvasEditor } from '../CanvasEditor';

export class Transition {
  app!: CanvasEditor;
  source!: string;
  target!: string;
  id!: string;

  constructor(args: TransitionType & { app: CanvasEditor }) {
    Object.assign(this, args);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const p1 = this.app.statesGroup.items.get(this.source);
    const p2 = this.app.statesGroup.items.get(this.target);

    if (!p1 || !p2) return;

    const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrow(
      p1.x,
      p1.y,
      p1.width,
      p1.height,
      p2.x,
      p2.y,
      p2.width,
      p2.height,
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
