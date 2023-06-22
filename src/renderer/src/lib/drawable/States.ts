import { nanoid } from 'nanoid';

import { State } from './State';

import { Elements } from '@renderer/types/diagram';
import { isPointInRectangle } from '../utils';
import { EventEmitter } from '../common/EventEmitter';
import { EdgeHandlers } from './EdgeHandlers';
import { Vector2D } from '@renderer/types/graphics';
import { Container } from '../basic/Container';

export class States extends EventEmitter {
  container!: Container;

  items: Map<string, State> = new Map();

  mouseDownState: State | null = null;
  mouseUpState: State | null = null;
  selectedState: State | null = null;
  edgeHandlers!: EdgeHandlers;

  dragging = false;
  grabOffset = { x: 0, y: 0 };

  constructor(container: Container, items: Elements['states']) {
    super();

    this.container = container;
    this.edgeHandlers = new EdgeHandlers(container.app, this.handleStartNewTransition);
    this.initItems(items);
    this.initEvents();
  }

  private initItems(items: Elements['states']) {
    for (const id in items) {
      const state = new State(this.container, id, items[id]);

      this.items.set(id, state);
    }
  }

  private initEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousedown', this.handleMouseDown);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas, { isSelected: this.selectedState?.id === state.id });
    });

    this.edgeHandlers.draw(ctx, canvas);
  }

  setMouseDownState(state: State) {
    this.mouseDownState = state;

    this.emit('mouseDownOnState', { mouseDownState: state });
  }

  setMouseUpState(state: State) {
    this.mouseUpState = state;

    this.emit('mouseUpOnState', { mouseUpState: state });
  }

  setSelectedState(state: State | null) {
    this.selectedState = state;

    if (state) {
      this.edgeHandlers.setCurrentState(state);

      this.emit('select', { selectedState: state });
    } else {
      this.edgeHandlers.remove();
    }
  }

  handleStartNewTransition = () => {
    this.emit('startNewTransition', {});
  };

  handleMouseDown = () => {
    if (!this.container.app.mouse.left) return;

    for (const state of this.items.values()) {
      if (!this.isStateUnderMouse(state)) continue;

      this.dragging = true;
      this.grabOffset = {
        x: this.container.app.mouse.x - state.bounds.x,
        y: this.container.app.mouse.y - state.bounds.y,
      };

      this.setMouseDownState(state);
    }
  };

  handleMouseMove = () => {
    if (!this.mouseDownState || !this.dragging || this.container.isPan) return;

    this.mouseDownState.move(
      this.container.app.mouse.x - this.grabOffset.x - this.container.offset.x,
      this.container.app.mouse.y - this.grabOffset.y - this.container.offset.y
    );

    document.body.style.cursor = 'grabbing';

    this.container.app.isDirty = true;
  };

  handleMouseUp = () => {
    let select: State | null = null;

    for (const state of this.items.values()) {
      if (!this.isStateUnderMouse(state)) continue;

      this.setMouseUpState(state);

      if (this.mouseDownState?.id === state.id) {
        select = state;
      }
    }

    this.dragging = false;
    this.setSelectedState(select);

    document.body.style.cursor = 'default';

    this.container.app.isDirty = true;
  };

  isStateUnderMouse(state: State) {
    return isPointInRectangle(state.bounds, {
      x: this.container.app.mouse.x,
      y: this.container.app.mouse.y,
    });
  }

  createState(position: Vector2D) {
    const width = 200;
    const height = 100;
    const x = position.x - width / 2;
    const y = position.y - height / 2;

    const id = nanoid(6);

    this.items.set(
      id,
      new State(this.container, id, {
        bounds: { x, y, width, height },
        events: {},
      })
    );
  }
}
