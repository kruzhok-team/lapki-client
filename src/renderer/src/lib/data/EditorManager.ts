import { Dispatch, SetStateAction } from 'react';

import { Elements, emptyElements } from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';

import { CanvasEditor } from '../CanvasEditor';
import ElementsJSONCodec from '../codecs/ElementsJSONCodec';
import { isPlatformAvailable } from './PlatformLoader';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import { Flasher } from '@renderer/components/Modules/Flasher';

export type EditorData = {
  name: string | null;
  shownName: string | null;
  content: string | null;
  data: Elements;
  modified: boolean;
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
    data: emptyElements(),
    modified: false,
  };
}

/**
 * Класс-прослойка, обеспечивающий взаимодействие с React.
 */
export class EditorManager {
  editor: CanvasEditor | null;
  state!: EditorData;
  updateState!: Dispatch<SetStateAction<EditorData>>;

  updateInterval?: ReturnType<typeof setInterval>;

  constructor(
    editor: CanvasEditor | null,
    initState: EditorData | undefined,
    updateState: Dispatch<SetStateAction<EditorData>>
  ) {
    // console.log(['EditorManager constructor']);
    this.editor = editor;
    this.state = initState ?? emptyEditorData();
    this.updateState = updateState;
  }

  mutateState(fn: (state: EditorData) => EditorData) {
    this.state = fn(this.state);
    this.updateState(this.state);
  }

  onDataUpdate(that: EditorManager) {
    return (data: Elements, modified: boolean) => {
      // console.log(['onDataUpdate-pre', that.state, data, modified]);
      that.mutateState((state) => ({
        ...state,
        data,
        content: JSON.stringify(data, null, 2),
        modified: modified || this.state.modified,
      }));
      console.log(['onDataUpdate-post', that.state]);
    };
  }

  watchEditor(editor: CanvasEditor) {
    this.editor = editor;
    editor.onDataUpdate(this.onDataUpdate(this));

    //Таймер для сохранения изменений сделанных в редакторе
    this.updateInterval = setInterval(() => {
      this.triggerDataUpdate();
    }, 5000);
  }

  unwatchEditor() {
    clearInterval(this.updateInterval);
  }

  triggerDataUpdate() {
    this.editor?.container.machine.dataTrigger(true);
  }

  newFile(platformIdx: string) {
    if (!isPlatformAvailable(platformIdx)) {
      throw Error('unknown platform ' + platformIdx);
    }
    const data = { ...emptyElements(), platform: platformIdx };
    this.editor?.loadData(data);
    this.mutateState((state) => ({
      ...state,
      name: null,
      shownName: null,
      content: JSON.stringify(data),
      data,
      modified: false,
    }));
  }

  compile(platform: string): void {
    Compiler.compile(platform, this.state.data);
  }

  flash(binaries: Array<Binary>, deviceID: string): void {
    Flasher.flash(binaries, deviceID);
  }

  getList(): void {
    Flasher.getList();
  }

  async open(): Promise<Either<FileError | null, null>> {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile');
    if (openData[0]) {
      try {
        const data = ElementsJSONCodec.toElements(openData[3]);
        if (!isPlatformAvailable(data.platform)) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${data.platform}".`,
          });
        }
        this.editor?.loadData(data);
        this.mutateState((state) => ({
          ...state,
          name: openData[1],
          shownName: openData[2],
          content: openData[3],
          data,
          modified: false,
        }));
        return makeRight(null);
      } catch (e) {
        let errText = 'unknown error';
        if (typeof e === 'string') {
          errText = e.toUpperCase();
        } else if (e instanceof Error) {
          errText = e.message;
        }
        return makeLeft({
          name: openData[1]!,
          content: 'Ошибка формата: ' + errText,
        });
      }
    } else if (openData[1]) {
      return makeLeft({
        name: openData[1]!,
        content: openData[3]!,
      });
    }
    return makeLeft(null);
  }

  async saveIntoFolder(data: Array<SourceFile | Binary>) {
    await window.electron.ipcRenderer.invoke('dialog:saveIntoFolder', data);
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
      this.mutateState((state) => ({
        ...state,
        name: saveData[1],
        shownName: saveData[2],
        modified: false,
      }));
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
      this.mutateState((state) => ({
        ...state,
        name: saveData[1],
        shownName: saveData[2],
        modified: false,
      }));
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
