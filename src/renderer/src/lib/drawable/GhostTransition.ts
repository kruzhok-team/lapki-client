import { Point } from '@renderer/types/graphics';

import { State } from './State';
import { degrees_to_radians, getLine } from '../utils';
import { BaseTransition } from './BaseTransition';
import { Container } from '../basic/Container';
import { transitionStyle } from '../styles';

/**
 * Неоформленный («призрачный») переход.
 * Используется для визуализации создаваемого перехода.
 */
export class GhostTransition extends BaseTransition {
  source!: State | null;
  target!: Point | null;

  constructor(container: Container) {
    super(container);
  }

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
      10,
      3,
      3
    );

    ctx.lineWidth = transitionStyle.width;

    this.drawLine(ctx, line);
    this.drawStart(ctx, line.start);
    this.drawEnd(ctx, line.end, degrees_to_radians(line.ee));
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
