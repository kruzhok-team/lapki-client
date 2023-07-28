import { State } from './State';
import { Point, TransitionLine } from '@renderer/types/graphics';
import { Transition as TransitionType } from '@renderer/types/diagram';
import { degrees_to_radians, getTransitionLines, rotatePoint } from '../utils';
import { transitionStyle } from '../styles';
import { Condition } from './Condition';
import { Container } from '../basic/Container';

/**
 * Переход между состояниями.
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также {@link Condition|условие} перехода.
 */
export class Transition {
  container!: Container;

  data!: TransitionType;
  source!: State;
  target!: State;
  condition!: Condition;

  constructor(
    container: Container,
    source: State,
    target: State,
    data: TransitionType,
  ) {
    this.container = container;
    this.data = data;

    this.source = source;
    this.target = target;

    this.condition = new Condition(this.container, this);
  }

  toJSON() {
    return this.data;
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

    ctx.arc(
      position.x,
      position.y,
      transitionStyle.startSize / this.container.scale,
      0,
      2 * Math.PI
    );
    ctx.fill();

    ctx.closePath();
  }

  private drawEnd(ctx: CanvasRenderingContext2D, position: Point, angle: number) {
    const width = 10 / this.container.scale;
    const height = 10 / this.container.scale;

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
      this.source.drawBounds,
      this.target.drawBounds,
      this.condition.drawBounds,
      10,
      3,
      3
    );

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.data.color;
    ctx.fillStyle = this.data.color;

    this.drawLine(ctx, sourceLine);
    this.drawLine(ctx, targetLine);
    this.drawStart(ctx, sourceLine.start);
    this.drawEnd(ctx, targetLine.start, degrees_to_radians(targetLine.se));
  }
}
