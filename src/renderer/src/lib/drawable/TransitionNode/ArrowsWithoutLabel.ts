import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Transition } from '@renderer/lib/drawable';
import { transitionStyle } from '@renderer/lib/styles';
import { Drawable } from '@renderer/lib/types/drawable';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getLine,
} from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';

/**
 * Выполняет отрисовку стрелки между двумя движущимися блоками:
 * от комментария к блоку назначения.
 */
export class ArrowsWithoutLabel implements Drawable {
  constructor(private parent: Transition, private app: CanvasEditor) {}

  draw(ctx: CanvasRenderingContext2D) {
    const targetBounds = this.parent.target.drawBounds;
    const sourceBounds = this.parent.source.drawBounds;

    const line = getLine({
      rect1: {
        ...targetBounds,
        height:
          targetBounds.childrenHeight === 0 ? targetBounds.height : targetBounds.childrenHeight,
      },
      rect2: {
        ...sourceBounds,
        height:
          sourceBounds.childrenHeight === 0 ? sourceBounds.height : sourceBounds.childrenHeight,
      },
      rectPadding: 10,
    });

    const data = this.parent.data;
    const fillStyle = data.color ?? getColor('default-transition-color');

    ctx.lineWidth = transitionStyle.width / this.app.controller.scale;
    ctx.strokeStyle = this.parent.data.color ?? getColor('default-transition-color');
    ctx.fillStyle = fillStyle;

    if (!this.parent.isSelected) {
      ctx.globalAlpha = transitionStyle.notSelectedAlpha;
    }
    drawCurvedLine(ctx, line, 12 / this.app.controller.scale);
    ctx.globalAlpha = 1;
    drawCircle(ctx, {
      position: line.end,
      radius: transitionStyle.startSize / this.app.controller.scale,
      fillStyle: fillStyle,
    });
    drawTriangle(ctx, line.start, 10 / this.app.controller.scale, degrees_to_radians(line.se));
  }
}
