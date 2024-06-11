import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { ChoiceState, State } from '@renderer/lib/drawable';
import { transitionStyle } from '@renderer/lib/styles';
import { Point } from '@renderer/lib/types/graphics';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getLine,
} from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';

/**
 * Неоформленный («призрачный») переход.
 * Используется для визуализации создаваемого перехода.
 */
export class GhostTransition {
  source!: State | ChoiceState | null;
  target!: Point | null;

  constructor(private app: CanvasEditor) {}

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (!this.source || !this.target) return;

    const sourceBounds = this.source.drawBounds;

    const line = getLine({
      rect1: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      rect2: {
        ...this.target,
        width: 1,
        height: 1,
      },
      rectPadding: 10,
    });

    ctx.lineWidth = transitionStyle.width;
    ctx.fillStyle = getColor('default-transition-color');

    drawCurvedLine(ctx, line, 12 / this.app.model.data.scale);
    drawCircle(ctx, {
      position: line.start,
      radius: transitionStyle.startSize / this.app.model.data.scale,
      fillStyle: getColor('default-transition-color'),
    });
    drawTriangle(ctx, line.end, 10 / this.app.model.data.scale, degrees_to_radians(line.ee));
  }

  setSource(state: State | ChoiceState) {
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
