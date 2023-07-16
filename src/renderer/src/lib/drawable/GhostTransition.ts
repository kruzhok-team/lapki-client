import { Point } from '@renderer/types/graphics';
import { State } from './State';

export class GhostTransition {
  source!: State | null;
  target!: Point | null;

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.source || !this.target) return;

    ctx.beginPath();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    const sourceBounds = this.source.drawBounds;

    const cx = sourceBounds.x + sourceBounds.width / 2;
    const cy = sourceBounds.y + sourceBounds.height / 2;

    ctx.moveTo(cx, cy);
    ctx.lineTo(this.target.x, this.target.y);
    ctx.stroke();

    ctx.closePath();
  }

  setSource(state: State) {
    this.source = state;
  }

  setTarget(target: Point) {
    this.target = target;
  }

  clear() {
    this.source = null;
    this.target = null;
  }
}
