import { State } from './State';

import { Elements } from '../../types';
import { CanvasEditor } from '../CanvasEditor';

export class StatesGroup {
  app!: CanvasEditor;

  items: Map<string, State> = new Map();

  selectedStateId: string | null = null;
  grabbedStateId: string | null = null;

  constructor(app: CanvasEditor, items: Elements['states']) {
    this.app = app;

    for (const id in items) {
      const state = new State({ app, statesGroup: this, id, ...items[id] });

      this.items.set(id, state);
    }

    // app.mouse.on('mousedown', () => {
    //   app.mouseDownEvents.push('StatesGroup');
    // });

    this.app.mouse.on('mouseup', this.handleMouseUp);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.items.forEach((state) => {
      state.draw(ctx, canvas);
    });
  }

  setSelectedId(stateId: string) {
    this.selectedStateId = stateId;

    this.app.isDirty = true;
  }

  setGrabbedId(stateId: string) {
    this.grabbedStateId = stateId;
  }

  handleMouseUp = () => {
    this.grabbedStateId = null;
  };
}
