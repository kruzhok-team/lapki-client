import { State } from './State';

import { Elements } from '../../types';
import { CanvasEditor } from '../CanvasEditor';
import { isPointInRectangle } from '../utils';
import { EventEmitter } from '../common/EventEmitter';

export class States extends EventEmitter {
  app!: CanvasEditor;

  items: Map<string, State> = new Map();

  mouseDownState: State | null = null;
  mouseUpState: State | null = null;
  selectedState: State | null = null;

  dragging = false;
  grabOffset = { x: 0, y: 0 };

  constructor(app: CanvasEditor, items: Elements['states']) {
    super();

    this.app = app;

    for (const id in items) {
      const state = new State({ id, ...items[id] });

      this.items.set(id, state);
    }

    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mousemove', this.handleMouseMove);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas, { isSelected: this.selectedState?.id === state.id });
    });
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
      this.emit('select', { selectedState: state });
    }
  }

  handleMouseDown = () => {
    if (!this.app.mouse.left) return;

    for (const state of this.items.values()) {
      if (!this.isStateUnderMouse(state)) continue;

      this.dragging = true;
      this.grabOffset = {
        x: this.app.mouse.x - state.bounds.x,
        y: this.app.mouse.y - state.bounds.y,
      };

      this.setMouseDownState(state);
    }
  };

  handleMouseMove = () => {
    if (!this.mouseDownState || !this.dragging) return;

    this.mouseDownState.move(
      this.app.mouse.x - this.grabOffset.x,
      this.app.mouse.y - this.grabOffset.y
    );

    document.body.style.cursor = 'grabbing';

    this.app.isDirty = true;
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

    this.app.isDirty = true;
  };

  isStateUnderMouse(state: State) {
    return isPointInRectangle(state.bounds, { x: this.app.mouse.x, y: this.app.mouse.y });
  }
}
