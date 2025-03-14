import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Transition } from '@renderer/lib/drawable';
import { transitionStyle } from '@renderer/lib/styles';
import { Point } from '@renderer/lib/types';
import { Children, Drawable } from '@renderer/lib/types/drawable';
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
  start?: Point;
  end?: Point;
  prevLabelPosition = { x: 0, y: 0 };
  prevSourcePosition = { x: 0, y: 0 };
  prevTargetPosition = { x: 0, y: 0 };
  constructor(private parent: Transition, private app: CanvasEditor) {
    this.prevLabelPosition = { ...this.parent.position };
    if (!this.data.sourcePoint) {
      this.data.sourcePoint = {
        ...this.parent.source.position,
      };
    }
    if (!this.data.targetPoint) {
      this.data.targetPoint = {
        ...this.parent.target.position,
      };
    }
    this.prevSourcePosition = { ...this.data.sourcePoint };
    this.prevTargetPosition = { ...this.data.targetPoint };
  }

  children?: Children | undefined;

  get data() {
    return this.parent.data;
  }

  private isEqualPoints = (point: Point, point2: Point) => {
    return point.x == point2.x && point.y === point2.y;
  };
  checkChange = (): boolean => {
    return (
      !this.isEqualPoints(this.prevSourcePosition, this.parent.source.position) &&
      !this.isEqualPoints(this.prevTargetPosition, this.parent.target.position) &&
      !this.isEqualPoints(this.prevLabelPosition, this.parent.position)
    );
  };

  recalculatePoint = (point: Point | undefined, point2: Point): Point | undefined => {
    if (!point) return;

    if (point.x === point2.x && point.y === point2.y) {
      // debugger;
      return undefined;
    }
    // debugger;
    return {
      x: (point.x + this.app.controller.offset.x) / this.app.controller.scale,
      y: (point.y + this.app.controller.offset.y) / this.app.controller.scale,
    };
  };

  draw(ctx: CanvasRenderingContext2D) {
    const sourceBounds = this.parent.source.drawBounds;
    const targetBounds = this.parent.target.drawBounds;

    let start: undefined | Point = undefined;
    let end: undefined | Point = undefined;
    start = {
      x: (this.data.sourcePoint!.x + this.app.controller.offset.x) / this.app.controller.scale,
      y: (this.data.sourcePoint!.y + this.app.controller.offset.y) / this.app.controller.scale,
    };
    end = {
      x: (this.data.sourcePoint!.x + this.app.controller.offset.x) / this.app.controller.scale,
      y: (this.data.sourcePoint!.y + this.app.controller.offset.y) / this.app.controller.scale,
    };

    if (this.checkChange()) {
      console.log('пересчитали!');
      start = undefined;
      end = undefined;
    }

    const sourceLine = getLine({
      rect1: {
        ...sourceBounds,
        height:
          sourceBounds.childrenHeight === 0 ? sourceBounds.height : sourceBounds.childrenHeight,
      },
      rect2: this.parent.drawBounds,
      rectPadding: 10,
      start,
      end,
    });
    this.start = sourceLine.start;
    this.end = sourceLine.end;

    const targetLine = getLine({
      rect1: {
        ...targetBounds,
        height:
          targetBounds.childrenHeight === 0 ? targetBounds.height : targetBounds.childrenHeight,
      },
      rect2: this.parent.drawBounds,
      rectPadding: 10,
      start: end,
      end: start,
      // start: this.data.targetPoint
      //   ? {
      //       x: (this.data.targetPoint.x + this.app.controller.offset.x) / this.app.controller.scale,
      //       y: (this.data.targetPoint.y + this.app.controller.offset.y) / this.app.controller.scale,
      //     }
      //   : undefined,
      // end: this.data.sourcePoint
      //   ? {
      //       x: (this.data.sourcePoint.x + this.app.controller.offset.x) / this.app.controller.scale,
      //       y: (this.data.sourcePoint.y + this.app.controller.offset.y) / this.app.controller.scale,
      //     }
      //   : undefined,
    });
    if (this.data.label?.position) {
      this.prevLabelPosition = { ...this.data.label?.position };
    }
    this.prevSourcePosition = { ...this.parent.source.position };
    this.prevTargetPosition = { ...this.parent.target.position };
    const data = this.parent.data;
    const fillStyle = data.color ?? getColor('default-transition-color');

    ctx.lineWidth = transitionStyle.width / this.app.controller.scale;
    ctx.strokeStyle = this.parent.data.color ?? getColor('default-transition-color');
    ctx.fillStyle = fillStyle;

    if (!this.parent.isSelected) {
      ctx.globalAlpha = transitionStyle.notSelectedAlpha;
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
