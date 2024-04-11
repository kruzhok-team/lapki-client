import { Container } from '@renderer/lib/basic/Container';
import { State } from '@renderer/lib/drawable/Node/State';
import { transitionStyle } from '@renderer/lib/styles';
import { Point } from '@renderer/lib/types/graphics';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getLine,
} from '@renderer/lib/utils';

/**
 * Неоформленный («призрачный») переход.
 * Используется для визуализации создаваемого перехода.
 */
export class GhostTransition {
  source!: State | null;
  target!: Point | null;

  constructor(public container: Container) {}

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (!this.source || !this.target) return;

    const sourceBounds = this.source.drawBounds;

    const line = getLine(
      sourceBounds,
      {
        ...this.target,
        width: 1,
        height: 1,
      },
      10
    );

    ctx.lineWidth = transitionStyle.width;

    drawCurvedLine(ctx, line, 12 / this.container.app.manager.data.scale);
    drawCircle(ctx, line.start, transitionStyle.startSize / this.container.app.manager.data.scale);
    drawTriangle(
      ctx,
      line.end,
      10 / this.container.app.manager.data.scale,
      degrees_to_radians(line.ee)
    );
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
