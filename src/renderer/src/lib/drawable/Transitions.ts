import { nanoid } from 'nanoid';

import { Elements } from '@renderer/types/diagram';
import { Transition } from './Transition';
import { State } from './State';
import { GhostTransition } from './GhostTransition';
import { Container } from '../basic/Container';
import { MyMouseEvent } from '../common/MouseEventEmitter';

type CreateStateCallback = (source: State, target: State) => void;

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

      const transition = new Transition(this.container, sourceState, targetState, condition, color);

      this.items.set(id, transition);
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

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.ghost.source) return;

    this.ghost.setTarget({ x: e.x, y: e.y });

    this.container.app.isDirty = true;
  };

  handleMouseUpOnState = ({ target }: { target: State }) => {
    if (!this.ghost.source) return;

    this.createCallback?.(this.ghost.source, target);

    this.ghost.clear();

    this.container.app.isDirty = true;
  };

  handleMouseUp = () => {
    if (!this.ghost.source) return;

    this.ghost.clear();

    this.container.app.isDirty = true;
  };

  createNewTransition(
    source: State,
    target: State,
    component: string,
    method: string,
    color: string
  ) {
    // TODO Доделать парвильный condition
    const transition = new Transition(
      this.container,
      source,
      target,
      {
        position: {
          x: 100,
          y: 100,
        },
        component,
        method,
      },
      color
    );

    this.items.set(nanoid(), transition);

    this.container.app.isDirty = true;
  }
}
