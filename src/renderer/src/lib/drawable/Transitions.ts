import { Transition } from './Transition';
import { State } from './State';
import { GhostTransition } from './GhostTransition';
import { Container } from '../basic/Container';
import { MyMouseEvent } from '../common/MouseEventEmitter';

type CreateStateCallback = (source: State, target: State) => void;

/**
 * Хранилище {@link Transition|переходов}.
 * Отрисовывает и хранит переходы, предоставляет метод для
 * создания новых переходов, в том числе отрисовывает
 * {@link GhostTransition|«призрачный» переход}.
 */
export class Transitions {
  container!: Container;

  ghost = new GhostTransition();

  createCallback?: CreateStateCallback;

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

  onTransitionCreate = (callback: CreateStateCallback) => {
    this.createCallback = callback;
  };

  handleStartNewTransition = (state) => {
    this.ghost.setSource(state);
  };

  handleConditionClick = (e: { target; event }) => {
    e.event.stopPropagation();
    this.container.machine.removeSelection();
    e.target.setIsSelected(true, JSON.stringify(e.target));
  };

  handleConditionDoubleClick = (e: { source; target }) => {
    this.createCallback?.(e.source, e.target);
  };

  //Удаление связей
  handleContextMenu = (e: { target; event }) => {
    e.event.stopPropagation();

    //this.emit('contextMenu', e);

    this.container.machine.deleteTransition(e.target);
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.isDirty = true;
  };

  handleMouseUpOnState = ({ target }: { target: State }) => {
    this.container.machine.removeSelection();
    if (!this.ghost.source) return;

    this.createCallback?.(this.ghost.source, target);

    this.ghost.clear();
  };

  handleMouseUp = () => {
    this.container.machine.removeSelection();
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
}
