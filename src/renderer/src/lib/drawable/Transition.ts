import { getBoxToBoxArrow } from 'curved-arrows';

import { State } from './State';
import { Vector2D } from '@renderer/types/graphics';
import { Condition } from '@renderer/types/diagram';
import { rotatePoint } from '../utils';
import { stateStyle, transitionStyle } from '../styles';

export class Transition {
  source!: State;
  target!: State;
  condition!: Condition | null;

  constructor(source: State, target: State, condition: Condition | null) {
    this.source = source;
    this.target = target;
    this.condition = condition;
  }

  private drawTriangle(
    ctx: CanvasRenderingContext2D,
    origin: Vector2D,
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

  private drawCondition(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.fillStyle = 'rgb(23, 23, 23)';
    // Draw condition
    ctx.beginPath();

    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    // ctx.strokeStyle = 'rgb(23, 23, 23)';
    // ctx.stroke();

    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    ctx.beginPath();

    ctx.fillText(this.condition?.component ?? '', x + 15, y + 15);
    ctx.fillText(this.condition?.method ?? '', x + 15, y + 30 + 15);

    ctx.closePath();
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const sourceCX = this.source.bounds.x + this.source.bounds.width / 2;
    const sourceCY = this.source.bounds.y + this.source.bounds.height / 2;
    const targetCX = this.target.bounds.x + this.target.bounds.width / 2;
    const targetCY = this.target.bounds.y + this.target.bounds.height / 2;

    const conditionWidth = 150;
    const conditionHeight = 75;
    const conditionX = (sourceCX + targetCX) / 2 - conditionWidth / 2;
    const conditionY = (sourceCY + targetCY) / 2 - conditionHeight / 2;

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.fillStyle = transitionStyle.bgColor;

    this.drawSourceArrow(ctx, conditionX, conditionY, conditionWidth, conditionHeight);
    this.drawTargetArrow(ctx, conditionX, conditionY, conditionWidth, conditionHeight);
    this.drawCondition(ctx, conditionX, conditionY, conditionWidth, conditionHeight);
  }
}
