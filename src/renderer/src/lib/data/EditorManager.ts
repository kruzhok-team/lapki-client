import { Dispatch, useSyncExternalStore } from 'react';
import { customAlphabet } from 'nanoid';

import {
  emptyElements,
  Event,
  Action,
  Condition,
  Transition,
  Component,
  Elements,
} from '@renderer/types/diagram';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';

import ElementsJSONCodec from '../codecs/ElementsJSONCodec';
import { isPlatformAvailable } from './PlatformLoader';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { Point, Rectangle } from '@renderer/types/graphics';
import { stateStyle } from '../styles';

import {
  emptyEditorData,
  emptyDataListeners,
  CreateStateParameters,
  EditorData,
  EditorDataPropertyName,
  EditorDataReturn,
  CreateTransitionParameters,
  ChangeTransitionParameters,
} from '@renderer/types/EditorManager';

export type FileError = {
  name: string;
  content: string;
};

/**
 * Класс-прослойка, обеспечивающий взаимодействие с React.
 *
 * TODO тут появился костыль, для удобного взаимодействия с состояниями нужно их хранить в объекте,
 * а в схеме они хранятся в массиве, поэтому когда нужна схема мы их конвертируем в массив
 * а внутри конвертируем в объект
 * возможно новый формат это поправит
 */
export class EditorManager {
  data = emptyEditorData();
  dataListeners = emptyDataListeners; //! Подписчиков обнулять нельзя, react сам разбирается

  resetEditor?: () => void;

  constructor() {}

  init(basename: string | null, name: string, elements: Elements) {
    this.data = emptyEditorData();

    const self = this;
    this.data = new Proxy(this.data, {
      set(target, prop, val, receiver) {
        const result = Reflect.set(target, prop, val, receiver);

        self.dataListeners[prop].forEach((listener) => listener());

        return result;
      },
    });

    this.data.basename = basename;
    this.data.name = name;
    this.data.elements = {
      ...elements,
      transitions: elements.transitions.reduce((acc, cur, i) => {
        acc[i] = cur;

        return acc;
      }, {}),
    };
    this.data.isInitialized = true;

    this.data.elements = new Proxy(this.data.elements, {
      set(target, key, val, receiver) {
        const result = Reflect.set(target, key, val, receiver);

        self.dataListeners[`elements.${String(key)}`].forEach((listener) => listener());

        return result;
      },
    });

    this.resetEditor?.();
  }

  subscribe = (propertyName: EditorDataPropertyName) => (listener: () => void) => {
    this.dataListeners[propertyName].push(listener);

    return () => {
      this.dataListeners[propertyName] = this.dataListeners[propertyName].filter(
        (l) => l !== listener
      );
    };
  };

  useData<T extends EditorDataPropertyName>(propertyName: T): EditorDataReturn<T> {
    const isShallow = (propertyName: string): propertyName is keyof EditorData => {
      return !propertyName.startsWith('elements.');
    };

    const getSnapshot = () => {
      if (isShallow(propertyName)) {
        return this.data[propertyName];
      }

      return this.data['elements'][propertyName.split('.')[1]];
    };

    return useSyncExternalStore(this.subscribe(propertyName), getSnapshot);
  }

  newFile(platformIdx: string) {
    if (!isPlatformAvailable(platformIdx)) {
      throw Error('unknown platform ' + platformIdx);
    }

    const elements = emptyElements();
    (elements.transitions as any) = [];
    elements.platform = platformIdx;
    this.init(null, 'Без названия', elements as any);
  }

  compile() {
    Compiler.compile(this.data.elements.platform, {
      ...this.data.elements,
      transitions: Object.values(this.data.elements.transitions),
    });
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
        this.init(
          openData[1]!.replace('.graphml', '.json'),
          openData[2]!.replace('.graphml', '.json'),
          data
        );

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

        this.init(openData[1] ?? '', openData[2] ?? '', data);

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

  getDataSerialized() {
    return JSON.stringify(
      { ...this.data.elements, transitions: Object.values(this.data.elements.transitions) },
      undefined,
      2
    );
  }

  getStateSerialized(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return null;

    return JSON.stringify(state, undefined, 2);
  }

  getTransitionSerialized(id: string) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return null;

    return JSON.stringify(transition, undefined, 2);
  }

  async stopLocalModule(module: string) {
    await window.electron.ipcRenderer.invoke('Module:stopLocalModule', module);
  }

  async save(): Promise<Either<FileError | null, null>> {
    if (!this.data.isInitialized) return makeLeft(null);
    if (!this.data.basename) {
      return await this.saveAs();
    }
    const saveData: [boolean, string, string] = await window.electron.ipcRenderer.invoke(
      'dialog:saveFile',
      this.data.basename,
      this.getDataSerialized()
    );
    if (saveData[0]) {
      this.data.basename = saveData[1];
      this.data.name = saveData[2];

      return makeRight(null);
    } else {
      return makeLeft({
        name: saveData[1],
        content: saveData[2],
      });
    }
  }

  async saveAs(): Promise<Either<FileError | null, null>> {
    if (!this.data.isInitialized) return makeLeft(null);
    const data = this.getDataSerialized();
    const saveData: [boolean, string | null, string | null] =
      await window.electron.ipcRenderer.invoke('dialog:saveAsFile', this.data.basename, data);
    if (saveData[0]) {
      this.data.basename = saveData[1];
      this.data.name = saveData[2];

      return makeRight(null);
    } else if (saveData[1]) {
      return makeLeft({
        name: saveData[1]!,
        content: saveData[2]!,
      });
    }
    return makeLeft(null);
  }

  createState({ name, position, parentId, id }: CreateStateParameters) {
    const getNewId = () => {
      const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);

      let id = nanoid();
      while (this.data.elements.states.hasOwnProperty(id)) {
        id = nanoid();
      }

      return id;
    };

    const { width, height } = stateStyle;
    const x = position.x - width / 2;
    const y = position.y - height / 2;

    const newId = id ?? getNewId();

    this.data.elements.states[newId] = {
      bounds: { x, y, width, height },
      events: [],
      name,
      parent: parentId,
    };

    // если у нас не было начального состояния, им станет новое
    if (this.data.elements.initialState === '') {
      this.data.elements.initialState = newId;
    }

    return newId;
  }

  newPictoState(id: string, events: Action[], triggerComponent: string, triggerMethod: string) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    const trueTab = state.events.find(
      (value) =>
        triggerComponent === value.trigger.component &&
        triggerMethod === value.trigger.method &&
        undefined === value.trigger.args // FIXME: сравнение по args может не работать
    );

    if (trueTab === undefined) {
      state.events = [
        ...state.events,
        {
          do: events,
          trigger: {
            component: triggerComponent,
            method: triggerMethod,
            //args: {},
          },
        },
      ];
    } else {
      trueTab.do = [...events];
    }

    return true;
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

  changeInitialState(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    this.data.elements.initialState = id;

    return true;
  }

  changeEvent(stateId: string, event: any, newValue: Event | Action) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    //Проверяем по условию, что мы редактируем, либо главное событие, либо действие
    if (event.actionIdx === null) {
      const trueTab = state.events.find(
        (value, id) =>
          event.eventIdx !== id &&
          newValue.component === value.trigger.component &&
          newValue.method === value.trigger.method &&
          undefined === value.trigger.args // FIXME: сравнение по args может не работать
      );

      if (trueTab === undefined) {
        state.events[event.eventIdx].trigger = newValue;
      } else {
        trueTab.do = [...trueTab.do, ...state.events[event.eventIdx].do];
        state.events.splice(event.eventIdx, 1);
      }
    } else {
      state.events[event.eventIdx].do[event.actionIdx] = newValue;
    }

    return true;
  }

  deleteEvent(stateId: string, eventIdx: number, actionIdx: number | null) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    if (actionIdx !== null) {
      state.events[eventIdx].do.splice(actionIdx!, 1);
      // Проверяем, есть ли действия в событие, если нет, то удалять его
      if (state.events[eventIdx].do.length === 0) {
        state.events.splice(eventIdx, 1);
      }
    } else {
      state.events.splice(eventIdx, 1);
    }

    return true;
  }

  createTransition({
    id,
    source,
    target,
    color,
    position,
    component,
    method,
    doAction,
    condition,
  }: CreateTransitionParameters) {
    const getNewId = () => {
      const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);

      let id = nanoid();
      while (this.data.elements.transitions.hasOwnProperty(id)) {
        id = nanoid();
      }

      return id;
    };

    const newId = id ?? getNewId();

    this.data.elements.transitions[newId] = {
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

    return String(newId);
  }

  changeTransition({
    id,
    color,
    component,
    method,
    doAction,
    condition,
  }: ChangeTransitionParameters) {
    const transition = this.data.elements.transitions[id] as Transition;
    if (!transition) return false;

    transition.color = color;
    transition.trigger.component = component;
    transition.trigger.method = method;
    transition.do = doAction;
    transition.condition = condition;

    return true;
  }

  changeTransitionPosition(id: string, position: Point) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return false;

    transition.position = position;

    return true;
  }

  deleteTransition(id: string) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return false;

    delete this.data.elements.transitions[id];

    return true;
  }

  addComponent(name: string, type: string) {
    if (this.data.elements.components.hasOwnProperty(name)) {
      console.log(['bad new component', name, type]);
      return false;
    }

    this.data.elements.components[name] = {
      type,
      parameters: {},
    };

    return true;
  }

  editComponent(name: string, parameters: Component['parameters']) {
    const component = this.data.elements.components[name];
    if (!component) return false;

    component.parameters = parameters;

    // TODO Выглядит костыльно
    this.data.elements.components = { ...this.data.elements.components };

    return true;
  }

  renameComponent(name: string, newName: string) {
    const component = this.data.elements.components[name];
    if (!component) return false;

    this.data.elements.components[newName] = component;

    delete this.data.elements.components[name];

    // TODO Выглядит костыльно
    this.data.elements.components = { ...this.data.elements.components };

    return true;
  }

  removeComponent(name: string) {
    const component = this.data.elements.components[name];
    if (!component) return false;

    delete this.data.elements.components[name];

    // TODO Выглядит костыльно
    this.data.elements.components = { ...this.data.elements.components };

    return true;
  }
}
