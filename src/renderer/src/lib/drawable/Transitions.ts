import { Condition } from './Condition';
import { GhostTransition } from './GhostTransition';
import { State } from './State';
import { Transition } from './Transition';

import { Container } from '../basic/Container';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { Point } from '@renderer/types/graphics';

/**
 * Функция, обрабатывающая запрос на создание перехода.
 */
type TransitionCreateCallback = (target: Condition) => void;

/**
 * Функция, обрабатывающая запрос на MouseUpState.
 */
type TransitionNewCreateCallback = (source: State, target: State) => void;

/**
 * Функция, обрабатывающая вызов контекстного меню.
 */
type MenuCallback = (target: Condition, pos: Point) => void;

/**
 * Контроллер {@link Transition|переходов}.
 * Обрабатывает события, связанные с переходами.
 * Отрисовывает переходы, в том числе {@link GhostTransition|«призрачный» переход}.
 */
export class Transitions {
  container!: Container;

  ghost!: GhostTransition;

  createCallback?: TransitionCreateCallback;
  newCreateCallback?: TransitionNewCreateCallback;
  menuCallback?: MenuCallback;

  constructor(container: Container) {
    this.container = container;
    this.ghost = new GhostTransition(container);
  }

  initEvents() {
    document.addEventListener('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);

    this.container.states.on('startNewTransition', this.handleStartNewTransition as any);
    this.container.states.on('mouseUpOnState', this.handleMouseUpOnState as any);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.container.machine.transitions.forEach((state) => {
      state.draw(ctx, canvas);
    });

    if (this.ghost.source) {
      this.ghost.draw(ctx, canvas);
    }
  }

  onTransitionCreate = (callback: TransitionCreateCallback) => {
    this.createCallback = callback;
  };

  onNewTransitionCreate = (callback: TransitionNewCreateCallback) => {
    this.newCreateCallback = callback;
  };

  onTransitionContextMenu = (callback: MenuCallback) => {
    this.menuCallback = callback;
  };

  handleStartNewTransition = (state) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (e: { target: Condition; event: MyMouseEvent }) => {
    e.event.stopPropagation();
    this.container.machine.removeSelection();
    e.target.setIsSelected(true);
  };

  handleConditionDoubleClick = (e: { target: Condition; event: MyMouseEvent }) => {
    e.event.stopPropagation();
    this.createCallback?.(e.target);
  };

  handleContextMenu = (e: { target: Condition; event: MyMouseEvent }) => {
    e.event.stopPropagation();

    this.menuCallback?.(e.target, { x: e.event.x, y: e.event.y });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.isDirty = true;
  };

  handleMouseUpOnState = (e: { target }) => {
    this.container.machine.removeSelection();

    if (!this.ghost.source) return;
    // Переход создаётся только на другое состояние
    // FIXME: вызывать создание внутреннего события при перетаскивании на себя?
    if (e.target instanceof State && e.target !== this.ghost.source) {
      this.newCreateCallback?.(this.ghost.source, e.target);
    }
    this.ghost.clear();
  };

  handleMouseUp = () => {
    if (!this.ghost.source) return;
    this.ghost.clear();
    this.container.isDirty = true;
  };

  watchTransition(transition: Transition) {
    //Если клик был на блок transition, то он выполняет функции
    transition.condition.on('click', this.handleConditionClick as any);
    //Если клик был на блок transition, то он выполняет функции
    transition.condition.on('dblclick', this.handleConditionDoubleClick as any);
    //Если клик был за пределами блока transition, то он выполняет функции
    transition.condition.on('mouseup', this.handleMouseUpOnState as any);

    transition.condition.on('contextmenu', this.handleContextMenu as any);
  }

  unwatchTransition(transition: Transition) {
    transition.condition.off('click', this.handleConditionClick as any);
    transition.condition.off('dblclick', this.handleConditionDoubleClick as any);
    transition.condition.off('mouseup', this.handleMouseUpOnState as any);
    transition.condition.off('contextmenu', this.handleContextMenu as any);
    transition.condition.unbindEvents();
  }
}
