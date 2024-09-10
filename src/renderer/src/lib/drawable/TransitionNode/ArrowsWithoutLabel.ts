import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Note, Transition } from '@renderer/lib/drawable';
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
      rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      rect2: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      rectPadding: 10,
    });

    const data = this.parent.data;

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.parent.data.color ?? getColor('default-transition-color');
    ctx.fillStyle = this.parent.data.color ?? getColor('default-transition-color');

    if (!this.parent.isSelected && this.parent.source instanceof Note) {
      ctx.globalAlpha = 0.3;
    }
    drawCurvedLine(ctx, line, 12 / this.app.controller.scale);
    ctx.globalAlpha = 1;
    drawCircle(ctx, {
      position: line.end,
      radius: transitionStyle.startSize / this.app.controller.scale,
      fillStyle: data.color,
    });
    drawTriangle(ctx, line.start, 10 / this.app.controller.scale, degrees_to_radians(line.se));
  }
}
