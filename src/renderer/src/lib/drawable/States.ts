import { nanoid } from 'nanoid';

import { State } from './State';

import { Elements } from '@renderer/types/diagram';
import { EventEmitter } from '../common/EventEmitter';
import { Point } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';

export class States extends EventEmitter {
  container!: Container;

  items: Map<string, State> = new Map();

  constructor(container: Container) {
    super();

    this.container = container;
  }

  initEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
  }

  initItems(items: Elements['states']) {
    for (const id in items) {
      const state = new State(this.container, id, items[id]);

      state.on('mouseup', this.handleMouseUpOnState as any);
      state.on('click', this.handleStateClick as any);

      state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;

      this.items.set(id, state);
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });
  }

  handleMouseUp = () => {
    this.items.forEach((state) => state.setIsSelected(false));

    this.container.app.isDirty = true;
  };

  handleStartNewTransition = (state: State) => {
    this.emit('startNewTransition', state);
  };

  handleMouseUpOnState = (e: { target: State; event: any }) => {
    this.emit('mouseUpOnState', e);
  };

  handleStateClick = ({ target, event }: { target: State; event: any }) => {
    event.stopPropagation();

    this.items.forEach((state) => state.setIsSelected(false));

    target.setIsSelected(true);

    this.container.app.isDirty = true;
  };

  createNewState(position: Point) {
    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;

    const id = nanoid(6);

    const state = new State(this.container, id, {
      bounds: { x, y, width, height },
      events: {},
    });

    state.on('mouseup', this.handleMouseUpOnState as any);
    state.on('click', this.handleStateClick as any);
    state.edgeHandlers.onStartNewTransition = this.handleStartNewTransition;

    this.items.set(id, state);
  }
}
