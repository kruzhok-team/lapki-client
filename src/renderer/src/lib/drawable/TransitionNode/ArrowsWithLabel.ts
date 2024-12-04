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
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также условие перехода.
 */
export class ArrowsWithLabel implements Drawable {
  constructor(private parent: Transition, private app: CanvasEditor) {}

  draw(ctx: CanvasRenderingContext2D) {
    const sourceBounds = this.parent.source.drawBounds;
    const targetBounds = this.parent.target.drawBounds;

    const sourceLine = getLine({
      rect1: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      rect2: this.parent.drawBounds,
      rectPadding: 10,
    });
    const targetLine = getLine({
      rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      rect2: this.parent.drawBounds,
      rectPadding: 10,
    });

    const data = this.parent.data;
    const fillStyle = data.color ?? getColor('default-transition-color');

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.parent.data.color ?? getColor('default-transition-color');
    ctx.fillStyle = fillStyle;

    if (!this.parent.isSelected) {
      ctx.globalAlpha = 0.3;
    }
    drawCurvedLine(ctx, sourceLine, 12 / this.app.controller.scale);
    drawCurvedLine(ctx, targetLine, 12 / this.app.controller.scale);
    ctx.globalAlpha = 1;
    drawCircle(ctx, {
      position: sourceLine.start,
      radius: transitionStyle.startSize / this.app.controller.scale,
      fillStyle: fillStyle,
    });
    drawTriangle(
      ctx,
      targetLine.start,
      10 / this.app.controller.scale,
      degrees_to_radians(targetLine.se)
    );
  }
}
