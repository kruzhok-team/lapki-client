import { v4 as uuidv4 } from 'uuid';

import { Elements } from '@renderer/types';
import { CanvasEditor } from '../CanvasEditor';
import { Transition } from './Transition';
import { State } from './State';

export class Transitions {
  app!: CanvasEditor;

  items: Map<string, Transition> = new Map();

  ghost = new Transition();
  isGhost = false;
  ghostTarget: { x: number; y: number } | null = null;

  canConnect = false;

  constructor(app: CanvasEditor, items: Elements['transitions']) {
    this.app = app;

    for (const id in items) {
      const sourceId = items[id].source;
      const targetId = items[id].target;

      const source = this.app.states.items.get(sourceId) as State;
      const target = this.app.states.items.get(targetId) as State;

      const transition = new Transition({ source, target });

      this.items.set(id, transition);
    }

    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('mouseup', this.handleMouseUp);

    this.app.states.on('mouseDownOnState', this.handleMouseDownOnState);
    this.app.states.on('mouseUpOnState', this.handleMouseUpOnState);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });

    if (this.isGhost && this.ghostTarget) {
      this.ghost.draw(ctx, canvas, this.ghostTarget);
    }
  }

  handleMouseDownOnState = () => {
    if (!this.canConnect) return;

    this.app.states.dragging = false;

    this.ghost.source = this.app.states.mouseDownState;
    this.isGhost = true;
  };

  handleMouseMove = () => {
    if (!this.canConnect || !this.isGhost) return;

    this.ghostTarget = { x: this.app.mouse.x, y: this.app.mouse.y };

    this.app.isDirty = true;
  };

  handleMouseUpOnState = () => {
    if (!this.canConnect) return;

    const target = this.app.states.mouseUpState as State;

    const transition = new Transition({ source: this.ghost.source as State, target });

    this.items.set(uuidv4(), transition);
  };

  handleMouseUp = () => {
    if (!this.canConnect) return;

    this.removeGhost();

    this.app.isDirty = true;
  };

  removeGhost() {
    this.isGhost = false;
    this.ghost.source = null;
    this.ghostTarget = null;
  }
}
