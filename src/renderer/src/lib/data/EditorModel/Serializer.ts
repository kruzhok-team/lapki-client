import { EditorModel } from './EditorModel';

import { exportCGML } from '../GraphmlBuilder';

type SaveMode = 'JSON' | 'Cyberiada';

export class Serializer {
  constructor(private editorManager: EditorModel) {}

  private get data() {
    return this.editorManager.data;
  }

  getAll(saveMode: SaveMode) {
    switch (saveMode) {
      case 'JSON':
        return JSON.stringify(this.data.elements, undefined, 2);
      case 'Cyberiada':
        return exportCGML(this.data.elements);
    }
  }

  getState(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return null;
    delete state.selection;
    return JSON.stringify(state, undefined, 2);
  }

  getTransition(id: string) {
    const transition = this.data.elements.transitions[id];
    if (!transition || !transition.label) return null;

    delete transition.selection;
    return JSON.stringify(transition, undefined, 2);
  }

  getNote(id: string) {
    const note = this.data.elements.notes[id];
    if (!note) return null;

    delete note.selection;
    return JSON.stringify(note, undefined, 2);
  }

  getComponent(name: string) {
    const component = this.data.elements.components[name];
    if (!component) return null;

    delete component.selection;
    return JSON.stringify(component, undefined, 2);
  }
}
