import { Transition } from './Transition';
import { State } from './State';
import { GhostTransition } from './GhostTransition';
import { Container } from '../basic/Container';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { Condition } from './Condition';

/**
 * Функция, обрабатывающая запрос на создание перехода.
 */
type TransitionCreateCallback = (source: State, target: State) => void;

/**
 * Функция, обрабатывающая вызов контекстного меню.
 */
type MenuCallback = (target: Condition) => void;

/**
 * Контроллер {@link Transition|переходов}.
 * Обрабатывает события, связанные с переходами.
 * Отрисовывает переходы, в том числе {@link GhostTransition|«призрачный» переход}.
 */
export class Transitions {
  container!: Container;

  ghost = new GhostTransition();

  createCallback?: TransitionCreateCallback;
  menuCallback?: MenuCallback;

  constructor(container: Container) {
    this.container = container;
  }

  initEvents() {
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

  onTransitionContextMenu = (callback: MenuCallback) => {
    this.menuCallback = callback;
  };

  handleStartNewTransition = (state) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (e: { target; event }) => {
    e.event.stopPropagation();
    this.container.machine.removeSelection();
    e.target.setIsSelected(true, JSON.stringify(e.target));
  };

  handleConditionDoubleClick = (e: { source; target; event }) => {
    e.event.stopPropagation();
    this.createCallback?.(e.source, e.target);
  };

  //Удаление связей
  handleContextMenu = (e: { target; event }) => {
    e.event.stopPropagation();
    //this.emit('contextMenu', e);
    this.menuCallback?.(e.target);
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.isDirty = true;
  };

  handleMouseUpOnState = (e: { target }) => {
    this.container.machine.removeSelection();

    if (!this.ghost.source) return;

    this.createCallback?.(this.ghost.source, e.target);

    this.ghost.clear();
  };

  handleMouseUp = () => {
    if (!this.ghost.source) return;
    this.ghost.clear();
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
