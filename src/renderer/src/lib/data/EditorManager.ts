import { Dispatch, useSyncExternalStore } from 'react';
import { customAlphabet, nanoid } from 'nanoid';

import { emptyElements, Action, Condition, Transition } from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';

import { CanvasEditor } from '../CanvasEditor';
import ElementsJSONCodec from '../codecs/ElementsJSONCodec';
import { isPlatformAvailable } from './PlatformLoader';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { Point, Rectangle } from '@renderer/types/graphics';
import { stateStyle } from '../styles';

export type FileError = {
  name: string;
  content: string;
};

const emptyEditorData = {
  isInitialized: false,
  isStale: false,
  basename: null as string | null,
  name: null as string | null,
  elements: emptyElements(),

  offset: { x: 0, y: 0 },
  scale: 1,
};

type EditorData = typeof emptyEditorData;
type EditorDataPropertyName = keyof EditorData;

const emptyDataListeners = Object.fromEntries(
  Object.entries(emptyEditorData).map(([k]) => [k, []])
) as any as {
  [key in EditorDataPropertyName]: (() => void)[];
};

/**
 * Класс-прослойка, обеспечивающий взаимодействие с React.
 */
export class EditorManager {
  editor: CanvasEditor | null = null;

  data = emptyEditorData;
  dataListeners = emptyDataListeners;

  constructor(editor: CanvasEditor | null) {
    this.editor = editor;

    const self = this;
    this.data = new Proxy(this.data, {
      set(target, prop, val, receiver) {
        const result = Reflect.set(target, prop, val, receiver);

        self.dataListeners[prop].forEach((listener) => listener());

        return result;
      },
    });

    // ? Тут непонятно нужно ли реагировать
    // this.data.elements = new Proxy(this.data.elements, {
    //   set(target, prop, val, receiver) {
    //     const result = Reflect.set(target, prop, val, receiver);

    //     // self.dataListeners[prop].forEach((listener) => listener());

    //     return result;
    //   },
    // });
  }

  subscribe = (propertyName: EditorDataPropertyName) => (listener: () => void) => {
    this.dataListeners[propertyName].push(listener);

    return () => {
      this.dataListeners[propertyName] = this.dataListeners[propertyName].filter(
        (l) => l !== listener
      );
    };
  };

  useData<T extends EditorDataPropertyName>(propertyName: T): EditorData[T] {
    return useSyncExternalStore(this.subscribe(propertyName), () => this.data[propertyName]);
  }

  newFile(platformIdx: string) {
    if (!isPlatformAvailable(platformIdx)) {
      throw Error('unknown platform ' + platformIdx);
    }

    this.data.isInitialized = true;
    this.data.basename = null;
    this.data.name = 'Без названия';
    this.data.elements = { ...emptyElements(), platform: platformIdx };

    // this.editor?.loadData(data);
    // this.mutateState((state) => ({
    //   ...state,
    //   name: null,
    //   shownName: 'Без названия',
    //   content: JSON.stringify(data),
    //   data,
    //   modified: false,
    // }));
  }

  compile(platform: string): void {
    Compiler.compile(platform, this.data.elements);
  }

  getList(): void {
    Flasher.getList();
  }

  parseImportData(importData, openData: [boolean, string | null, string | null, string]) {
    if (openData[0]) {
      try {
        const data = ElementsJSONCodec.toElements(importData);
        if (!isPlatformAvailable(data.platform)) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${data.platform}".`,
          });
        }
        this.data.basename = openData[1]!.replace('.graphml', '.json');
        this.data.name = openData[2]!.replace('.graphml', '.json');
        this.data.elements = data;
        this.data.isInitialized = true;

        // this.editor?.loadData(data);
        // this.mutateState((state) => ({
        //   ...state,
        //   name: openData[1]!.replace('.graphml', '.json'),
        //   shownName: openData[2]!.replace('.graphml', '.json'),
        //   content: JSON.stringify(importData),
        //   data,
        //   modified: false,
        // }));
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

  async import(
    platform: string,
    setImportData: Dispatch<[boolean, string | null, string | null, string]>
  ) {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile', platform);
    if (openData[0]) {
      Compiler.compile(`${platform}Import`, openData[3]);
      setImportData(openData);
    }
  }

  async open(): Promise<Either<FileError | null, null>> {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile', 'ide');
    if (openData[0]) {
      try {
        const data = ElementsJSONCodec.toElements(openData[3]);
        if (!isPlatformAvailable(data.platform)) {
          return makeLeft({
            name: openData[1]!,
            content: `Незнакомая платформа "${data.platform}".`,
          });
        }
        // this.editor?.loadData(data);
        this.data.basename = openData[1];
        this.data.name = openData[2];
        this.data.elements = data;
        this.data.isInitialized = true;

        // this.mutateState((state) => ({
        //   ...state,
        //   name: openData[1],
        //   shownName: openData[2],
        //   content: openData[3],
        //   data,
        //   modified: false,
        // }));
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

  async startLocalModule(module: string) {
    await window.electron.ipcRenderer.invoke('Module:startLocalModule', module);
  }

  changeFlasherLocal() {
    Flasher.changeLocal();
  }

  changeFlasherHost(host: string, port: number) {
    Flasher.changeHost(host, port);
  }

  async stopLocalModule(module: string) {
    await window.electron.ipcRenderer.invoke('Module:stopLocalModule', module);
  }

  async save(): Promise<Either<FileError | null, null>> {
    if (!this.editor) return makeLeft(null);
    if (!this.data.basename) {
      return await this.saveAs();
    }
    const saveData: [boolean, string, string] = await window.electron.ipcRenderer.invoke(
      'dialog:saveFile',
      this.data.basename,
      this.editor!.getData()
    );
    if (saveData[0]) {
      this.data.basename = saveData[1];
      this.data.name = saveData[2];

      // this.mutateState((state) => ({
      //   ...state,
      //   name: saveData[1],
      //   shownName: saveData[2],
      //   modified: false,
      // }));
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
      await window.electron.ipcRenderer.invoke('dialog:saveAsFile', this.data.basename, data);
    if (saveData[0]) {
      this.data.basename = saveData[1];
      this.data.name = saveData[2];

      // this.mutateState((state) => ({
      //   ...state,
      //   name: saveData[1],
      //   shownName: saveData[2],
      //   modified: false,
      // }));
      return makeRight(null);
    } else if (saveData[1]) {
      return makeLeft({
        name: saveData[1]!,
        content: saveData[2]!,
      });
    }
    return makeLeft(null);
  }

  createState(name: string, position: Point, parentId?: string) {
    const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);

    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;
    let id = nanoid();
    while (this.data.elements.states.hasOwnProperty(id)) {
      id = nanoid();
    }

    this.data.elements.states[id] = {
      bounds: { x, y, width, height },
      events: [],
      name,
      parent: parentId,
    };

    // если у нас не было начального состояния, им станет новое
    if (this.data.elements.initialState === '') {
      this.data.elements.initialState = id;
    }

    return id;
  }

  changeStateName(id: string, name: string) {
    if (!this.data.elements.states.hasOwnProperty(id)) return false;

    this.data.elements.states[id].name = name;

    return true;
  }

  changeStateBounds(id: string, bounds: Rectangle) {
    const state = this.data.elements.states[id];

    if (!state) return false;

    state.bounds = bounds;

    return true;
  }

  linkState(parentId: string, childId: string) {
    const parent = this.data.elements.states[parentId];
    const child = this.data.elements.states[childId];

    if (!parent || !child) return false;

    child.parent = parentId;

    return true;
  }

  unlinkState(id: string) {
    const state = this.data.elements.states[id];

    if (!state || !state.parent) return false;

    const parent = this.data.elements.states[state.parent];

    if (!parent) return false;

    delete state.parent;

    return true;
  }

  deleteState(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    // Если удаляемое состояние было начальным, стираем текущее значение
    if (this.data.elements.initialState === id) {
      this.data.elements.initialState = '';
    }

    delete this.data.elements.states[id];

    return true;
  }

  createTransition(
    source: string,
    target: string,
    color: string,
    position: Point,
    component: string,
    method: string,
    doAction: Action[],
    condition: Condition | undefined
  ) {
    const id = nanoid();

    this.data.elements.transitions[id] = {
      source,
      target,
      color,
      position,
      trigger: {
        component,
        method,
      },
      do: doAction,
      condition,
    };

    return id;
  }

  changeTransition(
    id: string,
    color: string,
    component: string,
    method: string,
    doAction: Action[],
    condition: Condition | undefined
  ) {
    const transition = this.data.elements.transitions[id] as Transition;
    if (!transition) return false;

    transition.color = color;
    transition.trigger.component = component;
    transition.trigger.method = method;
    transition.do = doAction;
    transition.condition = condition;

    return true;
  }

  deleteTransition(id: string) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return false;

    delete this.data.elements.transitions[id];

    return true;
  }
}
