import { Dispatch, SetStateAction } from 'react';
import { CanvasEditor } from '../CanvasEditor';
import { Component, Elements, emptyElements } from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';

export type EditorData = {
  name: string | null;
  shownName: string | null;
  content: string | null;
  components: { [id: string]: Component };
};

export type FileError = {
  name: string;
  content: string;
};

export function emptyEditorData(): EditorData {
  return {
    name: null,
    shownName: null,
    content: null,
    components: {},
  };
}

/**
 * Класс-прослойка, обеспечивающий взаимодействие с React.
 */
export class EditorManager {
  editor: CanvasEditor | null;
  state!: EditorData;
  updateState!: Dispatch<SetStateAction<EditorData>>;

  constructor(
    editor: CanvasEditor | null,
    state: EditorData,
    updateState: Dispatch<SetStateAction<EditorData>>
  ) {
    this.editor = editor;
    this.state = state;
    this.updateState = updateState;
  }

  watchEditor(editor: CanvasEditor) {
    this.editor = editor;
    editor.onDataUpdate((data) => {
      this.updateState({
        ...this.state,
        content: JSON.stringify(data, null, 2),
        components: data.components,
      });
    });
  }

  triggerDataUpdate() {
    this.editor?.container.machine.dataTrigger();
  }

  newFile() {
    this.editor?.loadData(emptyElements());
    this.updateState({
      ...this.state,
      name: null,
      shownName: null,
      content: JSON.stringify(emptyElements()),
    });
  }

  async open(): Promise<Either<FileError | null, null>> {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile');
    if (openData[0]) {
      // TODO: валидация файла и вывод ошибок
      const elements = JSON.parse(openData[3]) as Elements;
      this.editor?.loadData(elements);
      this.updateState({
        ...this.state,
        name: openData[1],
        shownName: openData[2],
        content: openData[3],
      });
      return makeRight(null);
    } else if (openData[1]) {
      return makeLeft({
        name: openData[1]!,
        content: openData[3]!,
      });
    }
    return makeLeft(null);
  }

  async save(): Promise<Either<FileError | null, null>> {
    if (!this.editor) return makeLeft(null);
    if (!this.state.name) {
      return await this.saveAs();
    }
    const saveData: [boolean, string, string] = await window.electron.ipcRenderer.invoke(
      'dialog:saveFile',
      this.state.name,
      this.editor!.getData()
    );
    if (saveData[0]) {
      this.updateState({
        ...this.state,
        name: saveData[1],
        shownName: saveData[2],
      });
      return makeRight(null);
    } else {
      return makeLeft({
        name: saveData[1],
        content: saveData[2],
      });
    }
  }

  async saveAs(): Promise<Either<FileError | null, null>> {
    if (!this.editor) return makeLeft(null);
    const data = this.editor!.getData();
    const saveData: [boolean, string | null, string | null] =
      await window.electron.ipcRenderer.invoke('dialog:saveAsFile', this.state.name, data);
    if (saveData[0]) {
      this.updateState({
        ...this.state,
        name: saveData[1],
        shownName: saveData[2],
      });
      return makeRight(null);
    } else if (saveData[1]) {
      return makeLeft({
        name: saveData[1]!,
        content: saveData[2]!,
      });
    }
    return makeLeft(null);
  }
}
