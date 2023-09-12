import { Transition as TransitionType } from '@renderer/types/diagram';

import { Condition } from './Condition';
import { State } from './State';

import { Container } from '../basic/Container';
import { transitionStyle } from '../styles';
import { degrees_to_radians, getTransitionLines } from '../utils';
import { BaseTransition } from './BaseTransition';

interface TransitionProps {
  container: Container;
  source: State;
  target: State;
  data: TransitionType;
  id: string;
}
/**
 * Переход между состояниями.
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также {@link Condition|условие} перехода.
 */
export class Transition extends BaseTransition {
  // data!: TransitionType;
  source!: State;
  target!: State;
  condition!: Condition;
  id!: string;

  constructor({ container, source, target, data, id }: TransitionProps) {
    super(container);

    // this.data = data;
    this.id = id;

    this.source = source;
    this.target = target;

    this.condition = new Condition(this.container, this, id);
  }

  get data(): TransitionType {
    return this.container.app.manager.data.elements.transitions[this.id];
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

    this.drawLine(ctx, sourceLine);
    this.drawLine(ctx, targetLine);
    this.drawStart(ctx, sourceLine.start);
    this.drawEnd(ctx, targetLine.start, degrees_to_radians(targetLine.se));

    this.condition.draw(ctx, canvas);
  }
}
