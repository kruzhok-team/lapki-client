import { nanoid } from 'nanoid';

import { Elements } from '@renderer/types';
import { CanvasEditor } from '../CanvasEditor';
import { Transition } from './Transition';
import { State } from './State';
import { GhostTransition } from './GhostTransition';

export class Transitions {
  app!: CanvasEditor;

  items: Map<string, Transition> = new Map();

  ghost = new GhostTransition();
  showGhost = false;

  constructor(app: CanvasEditor, items: Elements['transitions']) {
    this.app = app;

    this.initItems(items);
    this.initEvents();
  }

  private initItems(items: Elements['transitions']) {
    for (const id in items) {
      const sourceId = items[id].source;
      const targetId = items[id].target;

      const source = this.app.states.items.get(sourceId) as State;
      const target = this.app.states.items.get(targetId) as State;

      const transition = new Transition({ source, target });

      this.items.set(id, transition);
    }
  }

  private initEvents() {
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('mouseup', this.handleMouseUp);

    this.app.states.on('startNewTransition', this.handleStartNewTransition);
    this.app.states.on('mouseUpOnState', this.handleMouseUpOnState);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });

    if (this.showGhost) {
      this.ghost.draw(ctx, canvas);
    }
  }

  handleStartNewTransition = () => {
    this.ghost.setSource(this.app.states.stateHandlers.currentState as State);
    this.showGhost = true;
  };

  handleMouseMove = () => {
    if (!this.showGhost) return;

    this.ghost.setTarget({ x: this.app.mouse.x, y: this.app.mouse.y });

    this.app.isDirty = true;
  };

  handleMouseUpOnState = () => {
    if (!this.showGhost) return;

    const target = this.app.states.mouseUpState as State;

    const transition = new Transition({ source: this.ghost.source as State, target });

    this.items.set(nanoid(), transition);
  };

  handleMouseUp = () => {
    this.removeGhost();
  };

  removeGhost() {
    this.showGhost = false;
    this.ghost.clear();
  }
}
