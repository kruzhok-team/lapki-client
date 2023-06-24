import { nanoid } from 'nanoid';

import { State } from './State';

import { Elements } from '@renderer/types/diagram';
import { EventEmitter } from '../common/EventEmitter';
import { EdgeHandlers } from './EdgeHandlers';
import { Point } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';

export class States extends EventEmitter {
  container!: Container;

  items: Map<string, State> = new Map();

  mouseDownState: State | null = null;
  selectedState: State | null = null;
  edgeHandlers!: EdgeHandlers;

  constructor(container: Container, items: Elements['states']) {
    super();

    this.container = container;
    this.edgeHandlers = new EdgeHandlers(container.app, this.handleStartNewTransition);

    this.container.app.mouse.on('mouseup', this.deselect);

    this.initItems(items);
  }

  private initItems(items: Elements['states']) {
    for (const id in items) {
      const state = new State(this.container, id, items[id]);

      state.onMouseDown = this.handleStateMouseDown;
      state.onMouseUp = this.handleStateMouseUp;

      this.items.set(id, state);
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas, { isSelected: this.selectedState?.id === state.id });
    });

    this.edgeHandlers.draw(ctx, canvas);
  }

  selectState(state: State) {
    this.selectedState = state;

    this.edgeHandlers.setCurrentState(state);

    this.container.app.isDirty = true;
  }

  deselect = () => {
    this.selectedState = null;
    this.edgeHandlers.remove();

    this.container.app.isDirty = true;
  };

  handleStartNewTransition = () => {
    this.emit('startNewTransition', {});
  };

  handleStateMouseDown = (state: State) => {
    this.mouseDownState = state;
  };

  handleStateMouseUp = (state: State) => {
    this.emit('mouseUpOnState', { mouseUpState: state });

    if (!this.mouseDownState || this.mouseDownState.id !== state.id) return;

    this.selectState(state);
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

    state.onMouseDown = this.handleStateMouseDown;
    state.onMouseUp = this.handleStateMouseUp;

    this.items.set(id, state);
  }
}
