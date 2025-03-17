import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Transition } from '@renderer/lib/drawable';
import { transitionStyle } from '@renderer/lib/styles';
import { Point } from '@renderer/lib/types';
import { Drawable } from '@renderer/lib/types/drawable';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getLine,
  isEqualPoints,
} from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';

/**
 * Выполняет отрисовку стрелки между двумя движущимися блоками:
 * от комментария к блоку назначения.
 */
export class ArrowsWithoutLabel implements Drawable {
  start?: Point;
  end?: Point;
  prevSourcePosition = { x: 0, y: 0 };
  prevTargetPosition = { x: 0, y: 0 };
  lapkiGeometry = false; // Флаг отвечает за то, пересчитываем ли мы геометрию или нет.
  constructor(private parent: Transition, private app: CanvasEditor) {
    if (!this.data.sourcePoint) {
      this.data.sourcePoint = {
        ...this.parent.source.position,
      };
      this.lapkiGeometry = true;
    }
    if (!this.data.targetPoint) {
      this.data.targetPoint = {
        ...this.parent.target.position,
      };
      this.lapkiGeometry = true;
    }
    this.prevSourcePosition = { ...this.parent.source.position };
    this.prevTargetPosition = { ...this.parent.target.position };
  }

  get data() {
    return this.parent.data;
  }

  private checkChange = (): boolean => {
    return (
      !isEqualPoints(this.prevSourcePosition, this.parent.source.position) ||
      !isEqualPoints(this.prevTargetPosition, this.parent.target.position)
    );
  };

  draw(ctx: CanvasRenderingContext2D) {
    const targetBounds = this.parent.target.drawBounds;
    const sourceBounds = this.parent.source.drawBounds;

    let start: undefined | Point = undefined;
    let end: undefined | Point = undefined;

    start =
      this.data.sourcePoint && !this.lapkiGeometry
        ? {
            x:
              (+this.data.sourcePoint.x +
                this.parent.source.compoundPosition.x +
                this.app.controller.offset.x) /
              this.app.controller.scale,
            y:
              (+this.data.sourcePoint.y +
                this.parent.source.compoundPosition.y +
                this.app.controller.offset.y) /
              this.app.controller.scale,
          }
        : undefined;

    end =
      this.data.targetPoint && !this.lapkiGeometry
        ? {
            x:
              (+this.data.targetPoint.x +
                this.parent.target.compoundPosition.x +
                this.app.controller.offset.x) /
              this.app.controller.scale,
            y:
              (+this.data.targetPoint.y +
                this.parent.target.compoundPosition.y +
                this.app.controller.offset.y) /
              this.app.controller.scale,
          }
        : undefined;

    if (this.checkChange()) {
      // Если поменялись координаты, то пересчитываем на свой лад
      start = undefined;
      end = undefined;
      this.lapkiGeometry = true;
    }

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
      end: start,
      start: end,
      rectPadding: this.lapkiGeometry ? 10 : 0,
    });

    this.prevSourcePosition = { ...this.parent.source.position };
    this.prevTargetPosition = { ...this.parent.target.position };

    const data = this.parent.data;

    if (this.lapkiGeometry) {
      data.sourcePoint = {
        x:
          line.end.x / this.app.controller.scale -
          this.app.controller.offset.x -
          this.parent.source.compoundPosition.x,
        y:
          line.end.y / this.app.controller.scale -
          this.app.controller.offset.y -
          this.parent.source.compoundPosition.y,
      };
      data.targetPoint = {
        x:
          line.start.x / this.app.controller.scale -
          this.app.controller.offset.x -
          this.parent.target.compoundPosition.x,
        y:
          line.start.y / this.app.controller.scale -
          this.app.controller.offset.y -
          this.parent.target.compoundPosition.y,
      };
    }

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
