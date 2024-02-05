import { EditorManager } from './EditorManager';

import { exportGraphml } from '../GraphmlParser';

type SaveMode = 'JSON' | 'Cyberiada';

export class Serializer {
  constructor(private editorManager: EditorManager) {}

  private get data() {
    return this.editorManager.data;
  }

  getAll(saveMode: SaveMode) {
    switch (saveMode) {
      case 'JSON':
        return JSON.stringify(
          {
            ...this.data.elements,
            transitions: Object.values(this.data.elements.transitions),
            notes: Object.values(this.data.elements.notes),
          },
          undefined,
          2
        );
      case 'Cyberiada':
        return exportGraphml({
          ...this.data.elements,
          transitions: Object.values(this.data.elements.transitions),
          notes: Object.values(this.data.elements.notes),
        });
    }
  }

  getState(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return null;

    return JSON.stringify(state, undefined, 2);
  }

  getTransition(id: string) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return null;

    return JSON.stringify(transition, undefined, 2);
  }
}
