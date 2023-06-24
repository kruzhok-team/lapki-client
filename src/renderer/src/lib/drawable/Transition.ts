import { getBoxToBoxArrow } from 'curved-arrows';

import { State } from './State';
import { Point } from '@renderer/types/graphics';
import { Condition as ConditionType } from '@renderer/types/diagram';
import { getTransitionLines, rotatePoint } from '../utils';
import { stateStyle, transitionStyle } from '../styles';
import { Condition } from './Condition';
import { Container } from '../basic/Container';

export class Transition {
  container!: Container;

  source!: State;
  target!: State;
  condition!: Condition;

  constructor(container: Container, source: State, target: State, condition: ConditionType) {
    this.container = container;

    this.source = source;
    this.target = target;

    this.condition = new Condition(this.container, condition);
  }

  private drawTriangle(
    ctx: CanvasRenderingContext2D,
    origin: Point,
    width: number,
    height: number,
    angle: number
  ) {
    const p1 = rotatePoint({ x: origin.x - width, y: origin.y - height / 2 }, origin, angle);
    const p2 = rotatePoint({ x: origin.x - width, y: origin.y + height / 2 }, origin, angle);

    ctx.beginPath();

    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(origin.x, origin.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p1.x, p1.y);

    ctx.fill();

    ctx.closePath();
  }

  private drawSourceArrow(
    ctx: CanvasRenderingContext2D,
    conditionX: number,
    conditionY: number,
    conditionWidth: number,
    conditionHeight: number
  ) {
    const [sx, sy, c1x, c1y, c2x, c2y, ex, ey] = getBoxToBoxArrow(
      this.source.bounds.x,
      this.source.bounds.y,
      this.source.bounds.width,
      this.source.bounds.height,
      conditionX,
      conditionY,
      conditionWidth,
      conditionHeight
    );

    // Draw Start
    ctx.beginPath();
    ctx.arc(sx, sy, transitionStyle.startSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();

    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
    ctx.stroke();

    ctx.closePath();
  }

  private drawTargetArrow(
    ctx: CanvasRenderingContext2D,
    conditionX: number,
    conditionY: number,
    conditionWidth: number,
    conditionHeight: number
  ) {
    const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrow(
      conditionX,
      conditionY,
      conditionWidth,
      conditionHeight,
      this.target.bounds.x,
      this.target.bounds.y,
      this.target.bounds.width,
      this.target.bounds.height,
      {
        padEnd: transitionStyle.padEnd,
      }
    );

    ctx.beginPath();

    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
    ctx.stroke();

    ctx.closePath();

    // Draw End
    const origin = { x: ex, y: ey };
    if (ae === 0) {
      origin.x += transitionStyle.endSize;
    } else if (ae === 90) {
      origin.y += transitionStyle.endSize;
    } else if (ae === 180) {
      origin.x -= transitionStyle.endSize;
    } else if (ae === 270) {
      origin.y -= transitionStyle.endSize;
    }

    this.drawTriangle(
      ctx,
      origin,
      transitionStyle.endSize,
      transitionStyle.endSize,
      (ae * Math.PI) / 180
    );
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.condition.draw(ctx, canvas);

    const newLineSource = getTransitionLines(
      this.source.bounds,
      this.target.bounds,
      this.condition.bounds
    );

    const newLineTarget = getTransitionLines(
      this.target.bounds,
      this.source.bounds,
      this.condition.bounds
    );

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.fillStyle = transitionStyle.bgColor;

    // this.drawSourceArrow(ctx, conditionX, conditionY, conditionWidth, conditionHeight);
    // this.drawTargetArrow(ctx, conditionX, conditionY, conditionWidth, conditionHeight);
    // this.drawCondition(ctx, conditionX, conditionY, conditionWidth, conditionHeight);

    if (newLineSource) {
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'red';
      // Draw Start
      ctx.beginPath();
      ctx.arc(
        newLineSource.start.x,
        newLineSource.start.y,
        transitionStyle.startSize,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();

      ctx.beginPath();

      if (newLineSource.mid === null) {
        ctx.moveTo(newLineSource.start.x, newLineSource.start.y);
        ctx.lineTo(newLineSource.end.x, newLineSource.end.y);
      } else {
        const { start, mid, end } = newLineSource;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(mid.x, mid.y);
        ctx.lineTo(end.x, end.y);
      }

      ctx.stroke();
      ctx.closePath();
    }

    if (newLineTarget) {
      ctx.strokeStyle = 'lime';
      ctx.fillStyle = 'lime';

      ctx.beginPath();

      if (newLineTarget.mid === null) {
        ctx.moveTo(newLineTarget.start.x, newLineTarget.start.y);
        ctx.lineTo(newLineTarget.end.x, newLineTarget.end.y);
      } else {
        const { start, mid, end } = newLineTarget;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(mid.x, mid.y);
        ctx.lineTo(end.x, end.y);
      }

      ctx.stroke();
      ctx.closePath();

      this.drawTriangle(ctx, newLineTarget.start, 10, 10, newLineTarget.ae);
    }
  }
}
