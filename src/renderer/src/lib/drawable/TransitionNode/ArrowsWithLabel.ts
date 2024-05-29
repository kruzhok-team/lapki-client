import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Transition } from '@renderer/lib/drawable';
import { transitionStyle } from '@renderer/lib/styles';
import { Drawable } from '@renderer/lib/types/drawable';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getTransitionLines,
} from '@renderer/lib/utils';

/**
 * Выполняет отрисовку стрелки между двумя(тремя) движущимися блоками:
 */
export class ArrowsWithLabel implements Drawable {
  constructor(private parent: Transition, private app: CanvasEditor) {}

  draw(ctx: CanvasRenderingContext2D) {
    const sourceBounds = this.parent.source.drawBounds;
    const targetBounds = this.parent.target.drawBounds;

    const { sourceLine, targetLine } = getTransitionLines(
      { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      this.parent.drawBounds,
      10
    );

    const data = this.parent.data;

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = data.color;
    ctx.fillStyle = data.color;

    if (!this.parent.isSelected) {
      ctx.globalAlpha = 0.3;
    }
    drawCurvedLine(ctx, sourceLine, 12 / this.app.model.data.scale);
    drawCurvedLine(ctx, targetLine, 12 / this.app.model.data.scale);
    ctx.globalAlpha = 1;
    drawCircle(ctx, {
      position: sourceLine.start,
      radius: transitionStyle.startSize / this.app.model.data.scale,
      fillStyle: data.color,
    });
    drawTriangle(
      ctx,
      targetLine.start,
      10 / this.app.model.data.scale,
      degrees_to_radians(targetLine.se)
    );
  }
}
