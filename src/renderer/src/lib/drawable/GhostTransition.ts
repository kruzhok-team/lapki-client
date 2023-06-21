import { Vector2D } from '../types';
import { State } from './State';

export class GhostTransition {
  source!: State | null;
  target!: Vector2D | null;

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.source || !this.target) return;

    ctx.beginPath();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    const cx = this.source.bounds.x + this.source.bounds.width / 2;
    const cy = this.source.bounds.y + this.source.bounds.height / 2;

    ctx.moveTo(cx, cy);
    ctx.lineTo(this.target.x, this.target.y);
    ctx.stroke();

    ctx.closePath();
  }

  setSource(state: State) {
    this.source = state;
  }

  setTarget(target: Vector2D) {
    this.target = target;
  }

  clear() {
    this.source = null;
    this.target = null;
  }
}
