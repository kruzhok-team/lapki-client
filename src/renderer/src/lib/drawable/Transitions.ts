import { nanoid } from 'nanoid';

import { Elements } from '@renderer/types/diagram';
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

  items: Map<string, Transition> = new Map();
  ghost = new GhostTransition();

  createCallback?: CreateStateCallback;

  constructor(container: Container) {
    this.container = container;
  }

  initItems(items: Elements['transitions']) {
    for (const id in items) {
      const { source, target, condition, color } = items[id];

      const sourceState = this.container.states.items.get(source) as State;
      const targetState = this.container.states.items.get(target) as State;

      const transition = new Transition(this.container, sourceState, targetState, color, condition);

      this.items.set(id, transition);

      //Если клик был на блок transition, то он выполняет функции
      transition.condition.on('click', this.handleConditionClick as any);
      //Если клик был на блок transition, то он выполняет функции
      transition.condition.on('dblclick', this.handleConditionDoubleClick as any);
      //Если клик был за пределами блока transition, то он выполняет функции
      transition.condition.on('mouseup', this.handleMouseUpOnState as any);

      transition.condition.on('contextmenu', this.handleContextMenu as any);
    }
  }

  initEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);

    this.container.states.on('startNewTransition', this.handleStartNewTransition as any);
    this.container.states.on('mouseUpOnState', this.handleMouseUpOnState as any);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });

    if (this.ghost.source) {
      this.ghost.draw(ctx, canvas);
    }
  }

  onTransitionCreate = (callback: CreateStateCallback) => {
    this.createCallback = callback;
  };

  handleStartNewTransition = (state: State) => {
    this.ghost.setSource(state);
  };

  private removeSelection() {
    this.items.forEach((value) => {
      value.condition.setIsSelected(false, '');
      value.condition.setIsSelectedMenu(false);
    });
    this.container.states.items.forEach((state) => {
      state.setIsSelected(false, '');
      state.setIsSelectedMenu(false);
    });

    this.container.app.isDirty = true;
  }

  handleConditionClick = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();
    this.removeSelection();

    target.setIsSelected(true, JSON.stringify(target));
  };

  handleConditionDoubleClick = ({ source, target }: { source: State; target: State }) => {
    this.createCallback?.(source, target);
  };

  handleContextMenu = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();
    this.removeSelection();

    target.setIsSelectedMenu(true);
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.app.isDirty = true;
  };

  handleMouseUpOnState = ({ target }: { target: State }) => {
    this.removeSelection();
    if (!this.ghost.source) return;

    this.createCallback?.(this.ghost.source, target);

    this.ghost.clear();
  };

  handleMouseUp = () => {
    this.removeSelection();
    if (!this.ghost.source) return;

    this.ghost.clear();
  };

  createNewTransition(
    source: State,
    target: State,
    color: string,
    component: string,
    method: string
  ) {
    // TODO Доделать парвильный condition
    const transition = new Transition(this.container, source, target, color, {
      position: {
        x: 100,
        y: 100,
      },
      component,
      method,
    });

    transition.condition.on('click', this.handleConditionClick as any);
    transition.condition.on('dblclick', this.handleConditionDoubleClick as any);
    transition.condition.on('mouseup', this.handleMouseUpOnState as any);
    transition.condition.on('contextmenu', this.handleContextMenu as any);

    this.items.set(nanoid(), transition);

    this.container.app.isDirty = true;
  }
}
