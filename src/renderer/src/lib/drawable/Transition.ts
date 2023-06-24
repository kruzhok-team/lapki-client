import { getBoxToBoxArrow } from 'curved-arrows';

import { State } from './State';
import { Point, TransitionLine } from '@renderer/types/graphics';
import { Condition as ConditionType } from '@renderer/types/diagram';
import { degrees_to_radians, getTransitionLines, rotatePoint } from '../utils';
import { stateStyle, transitionStyle } from '../styles';
import { Condition } from './Condition';
import { Container } from '../basic/Container';

export class Transition {
  container!: Container;

  source!: State;
  target!: State;
  condition!: Condition;
  color!: string;

  constructor(
    container: Container,
    source: State,
    target: State,
    condition: ConditionType,
    color: string
  ) {
    this.container = container;

    this.source = source;
    this.target = target;

    this.condition = new Condition(this.container, condition);

    this.color = color;
  }

  private drawLine(ctx: CanvasRenderingContext2D, line: TransitionLine) {
    const { start, mid, end } = line;

    ctx.beginPath();

    ctx.moveTo(start.x, start.y);
    if (mid) {
      ctx.lineTo(mid.x, mid.y);
    }
    ctx.lineTo(end.x, end.y);

    ctx.stroke();

    ctx.closePath();
  }

  private drawStart(ctx: CanvasRenderingContext2D, position: Point) {
    ctx.beginPath();

    ctx.arc(position.x, position.y, transitionStyle.startSize, 0, 2 * Math.PI);
    ctx.fill();

    ctx.closePath();
  }

  private drawEnd(ctx: CanvasRenderingContext2D, position: Point, angle: number) {
    const width = 10;
    const height = 10;

    const p1 = rotatePoint({ x: position.x - width, y: position.y - height / 2 }, position, angle);
    const p2 = rotatePoint({ x: position.x - width, y: position.y + height / 2 }, position, angle);

    ctx.beginPath();

    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(position.x, position.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p1.x, p1.y);

    ctx.fill();

    ctx.closePath();
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.condition.draw(ctx, canvas);

    const { sourceLine, targetLine } = getTransitionLines(
      this.source.bounds,
      this.target.bounds,
      this.condition.bounds,
      10,
      3,
      3
    );

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;

    this.drawLine(ctx, sourceLine);
    this.drawLine(ctx, targetLine);
    this.drawStart(ctx, sourceLine.start);
    this.drawEnd(ctx, targetLine.start, degrees_to_radians(targetLine.se));
  }
}
