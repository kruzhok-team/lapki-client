import { Transition as TransitionType } from '@renderer/types/diagram';

import { Condition } from './Condition';

import { Container } from '../basic/Container';
import { transitionStyle } from '../styles';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getTransitionLines,
} from '../utils';

// interface TransitionProps {
// container: Container;
// source: State;
// target: State;
// id: string;
// }
/**
 * Переход между состояниями.
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также {@link Condition|условие} перехода.
 */
export class Transition {
  // data!: TransitionType;
  // source!: State;
  // target!: State;
  condition!: Condition;
  id!: string;

  constructor(public container: Container, id: string) {
    this.id = id;

    // this.source = source;
    // this.target = target;

    this.condition = new Condition(this.container, this, id);
  }

  get data(): TransitionType {
    return this.container.app.manager.data.elements.transitions[this.id];
  }

  get source() {
    return this.container.machine.states.get(this.data.source)!;
  }

  get target() {
    return this.container.machine.states.get(this.data.target)!;
  }

  toJSON(): TransitionType {
    return this.data;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
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

    drawCurvedLine(ctx, sourceLine, 12 / this.container.app.manager.data.scale);
    drawCurvedLine(ctx, targetLine, 12 / this.container.app.manager.data.scale);
    drawCircle(
      ctx,
      sourceLine.start,
      transitionStyle.startSize / this.container.app.manager.data.scale
    );
    drawTriangle(
      ctx,
      targetLine.start,
      10 / this.container.app.manager.data.scale,
      degrees_to_radians(targetLine.se)
    );

    this.condition.draw(ctx, canvas);
  }
}
