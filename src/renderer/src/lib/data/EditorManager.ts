import { Dispatch, useSyncExternalStore } from 'react';

import { customAlphabet } from 'nanoid';

import { Compiler } from '@renderer/components/Modules/Compiler';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { Binary, SourceFile } from '@renderer/types/CompilerTypes';
import {
  emptyElements,
  Event,
  Action,
  Transition,
  Component,
  Elements,
  EventData,
} from '@renderer/types/diagram';
import {
  emptyEditorData,
  emptyDataListeners,
  CreateStateParameters,
  EditorData,
  EditorDataPropertyName,
  EditorDataReturn,
  CreateTransitionParameters,
  ChangeTransitionParameters,
  ChangeStateEventsParams,
  AddComponentParams,
} from '@renderer/types/EditorManager';
import { Either, makeLeft, makeRight } from '@renderer/types/Either';
import { Point, Rectangle } from '@renderer/types/graphics';

import { isPlatformAvailable } from './PlatformLoader';

import ElementsJSONCodec from '../codecs/ElementsJSONCodec';
import { EventSelection } from '../drawable/Events';
import { stateStyle } from '../styles';

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

  init(basename: string | null, name: string, elements: Elements) {
    this.data.isInitialized = false; // Для того чтобы весь интрфейс обновился

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

    // eslint-disable-next-line react-hooks/rules-of-hooks
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

  async open(path?: string): Promise<Either<FileError | null, null>> {
    const openData: [boolean, string | null, string | null, string] =
      await window.electron.ipcRenderer.invoke('dialog:openFile', 'ide', path);
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

  createState(args: CreateStateParameters) {
    const { name, parentId, id, events = [], placeInCenter = false } = args;
    let position = args.position;
    const { width, height } = stateStyle;

    const getNewId = () => {
      const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);

      let id = nanoid();
      while (this.data.elements.states.hasOwnProperty(id)) {
        id = nanoid();
      }

      return id;
    };

    const centerPosition = () => {
      return {
        x: position.x - width / 2,
        y: position.y - height / 2,
      };
    };

    position = placeInCenter ? centerPosition() : position;

    const newId = id ?? getNewId();

    this.data.elements.states[newId] = {
      bounds: { ...position, width, height },
      events: events,
      name,
      parent: parentId,
    };

    // если у нас не было начального состояния, им станет новое
    if (this.data.elements.initialState === '') {
      this.data.elements.initialState = newId;
    }

    return newId;
  }

  changeStateEvents({ id, triggerComponent, triggerMethod, actions }: ChangeStateEventsParams) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    const eventIndex = state.events.findIndex(
      (value) =>
        triggerComponent === value.trigger.component &&
        triggerMethod === value.trigger.method &&
        undefined === value.trigger.args // FIXME: сравнение по args может не работать
    );
    const event = state.events[eventIndex];

    if (event === undefined) {
      state.events = [
        ...state.events,
        {
          do: actions,
          trigger: {
            component: triggerComponent,
            method: triggerMethod,
            // args: {},
          },
        },
      ];
    } else {
      if (actions.length) {
        event.do = [...actions];
      } else {
        state.events.splice(eventIndex, 1);
      }
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

    delete this.data.elements.states[id];

    return true;
  }

  changeInitialState(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    this.data.elements.initialState = id;

    return true;
  }

  createEvent(stateId: string, eventData: EventData, eventIdx?: number) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    if (eventIdx !== undefined) {
      state.events.splice(eventIdx, 0, eventData);
    } else {
      state.events.push(eventData);
    }

    return true;
  }

  createEventAction(stateId: string, event: EventSelection, value: Action) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do.splice(actionIdx ?? state.events[eventIdx].do.length - 1, 0, value);

    return true;
  }

  changeEvent(stateId: string, eventIdx: number, newValue: Event) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    // const event = state.events.find(
    //   (value, id) =>
    //     eventIdx !== id &&
    //     newValue.component === value.trigger.component &&
    //     newValue.method === value.trigger.method &&
    //     undefined === value.trigger.args // FIXME: сравнение по args может не работать
    // );

    const event = state.events[eventIdx];

    if (!event) return false;

    event.trigger = newValue;

    // if (trueTab === undefined) {
    //   state.events[eventIdx].trigger = newValue;
    // } else {
    // event.do = [...event.do, ...state.events[eventIdx].do];
    // state.events.splice(eventIdx, 1);
    // }

    return true;
  }

  changeEventAction(stateId: string, event: EventSelection, newValue: Action) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do[actionIdx as number] = newValue;

    return true;
  }

  deleteEvent(stateId: string, eventIdx: number) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    state.events.splice(eventIdx, 1);

    return true;
  }

  deleteEventAction(stateId: string, event: EventSelection) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do.splice(actionIdx as number, 1);

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

  addComponent({ name, type, parameters = {} }: AddComponentParams) {
    if (this.data.elements.components.hasOwnProperty(name)) {
      console.log(['bad new component', name, type]);
      return false;
    }

    this.data.elements.components[name] = {
      type,
      parameters,
    };

    // TODO Выглядит костыльно
    this.data.elements.components = { ...this.data.elements.components };

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
