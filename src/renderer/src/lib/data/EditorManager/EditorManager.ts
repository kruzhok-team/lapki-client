import { useSyncExternalStore } from 'react';

import { customAlphabet } from 'nanoid';

import {
  Event,
  Action,
  Transition,
  Component,
  Elements,
  EventData,
  InitialState,
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
import { Point, Rectangle } from '@renderer/types/graphics';

import { FilesManager } from './FilesManager';
import { Serializer } from './Serializer';

import { EventSelection } from '../../drawable/Events';
import { stateStyle } from '../../styles';

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
  files = new FilesManager(this);
  serializer = new Serializer(this);

  resetEditor?: () => void;

  init(basename: string | null, name: string, elements: Elements) {
    this.data.isInitialized = false; // Для того чтобы весь интрфейс обновился
    this.triggerDataUpdate('isInitialized');

    this.data = emptyEditorData();
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

    this.triggerDataUpdate('basename', 'name', 'elements', 'isInitialized', 'isStale');

    this.resetEditor?.();
  }

  triggerSave(basename: string | null, name: string | null) {
    this.data.basename = basename;
    this.data.name = name ?? 'Без названия';
    this.data.isStale = false;
    this.triggerDataUpdate('basename', 'name', 'isStale');
  }

  makeStale() {
    this.data.isStale = true;
    this.triggerDataUpdate('isStale');
  }

  private subscribe = (propertyName: EditorDataPropertyName) => (listener: () => void) => {
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

  private triggerDataUpdate<T extends EditorDataPropertyName>(...propertyNames: T[]) {
    const isShallow = (propertyName: string): propertyName is keyof EditorData => {
      return !propertyName.startsWith('elements.');
    };

    for (const name of propertyNames) {
      if (!isShallow(name)) {
        const subName = name.split('.')[1];
        const prevValue = this.data.elements[subName];

        // Ссылку нужно обновлять только у объектов
        if (typeof prevValue === 'object' && prevValue !== null) {
          this.data.elements[subName] = {
            ...prevValue,
          };
        }

        this.data.isStale = true;
        this.dataListeners['isStale'].forEach((listener) => listener());
      }

      this.dataListeners[name].forEach((listener) => listener());
    }
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

    this.triggerDataUpdate('elements.states');

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

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeStateName(id: string, name: string) {
    if (!this.data.elements.states.hasOwnProperty(id)) return false;

    this.data.elements.states[id].name = name;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeStateBounds(id: string, bounds: Rectangle) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    state.bounds = bounds;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  linkState(parentId: string, childId: string) {
    const parent = this.data.elements.states[parentId];
    const child = this.data.elements.states[childId];

    if (!parent || !child) return false;

    child.parent = parentId;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  unlinkState(id: string) {
    const state = this.data.elements.states[id];

    if (!state || !state.parent) return false;

    const parent = this.data.elements.states[state.parent];

    if (!parent) return false;

    delete state.parent;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  deleteState(id: string) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    delete this.data.elements.states[id];

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeInitialState(initialState: InitialState) {
    const state = this.data.elements.states[initialState.target];
    if (!state) return false;

    this.data.elements.initialState = initialState;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeInitialStatePosition(position: Point) {
    if (!this.data.elements.initialState) return;

    this.data.elements.initialState.position = position;

    this.triggerDataUpdate('elements.initialState');

    return true;
  }

  deleteInitialState() {
    this.data.elements.initialState = null;

    this.triggerDataUpdate('elements.initialState');

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

    this.triggerDataUpdate('elements.states');

    return true;
  }

  createEventAction(stateId: string, event: EventSelection, value: Action) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do.splice(actionIdx ?? state.events[eventIdx].do.length - 1, 0, value);

    this.triggerDataUpdate('elements.states');

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

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeEventAction(stateId: string, event: EventSelection, newValue: Action) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do[actionIdx as number] = newValue;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  deleteEvent(stateId: string, eventIdx: number) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    state.events.splice(eventIdx, 1);

    this.triggerDataUpdate('elements.states');

    return true;
  }

  deleteEventAction(stateId: string, event: EventSelection) {
    const state = this.data.elements.states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do.splice(actionIdx as number, 1);

    this.triggerDataUpdate('elements.states');

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

    this.triggerDataUpdate('elements.transitions');

    return String(newId);
  }

  changeTransition({
    id,
    source,
    target,
    color,
    component,
    method,
    doAction,
    condition,
  }: ChangeTransitionParameters) {
    const transition = this.data.elements.transitions[id] as Transition;
    if (!transition) return false;

    transition.source = source;
    transition.target = target;
    transition.color = color;
    transition.trigger.component = component;
    transition.trigger.method = method;
    transition.do = doAction;
    transition.condition = condition;

    this.triggerDataUpdate('elements.transitions');

    return true;
  }

  changeTransitionPosition(id: string, position: Point) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return false;

    transition.position = position;

    this.triggerDataUpdate('elements.transitions');

    return true;
  }

  deleteTransition(id: string) {
    const transition = this.data.elements.transitions[id];
    if (!transition) return false;

    delete this.data.elements.transitions[id];

    this.triggerDataUpdate('elements.transitions');

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

    this.triggerDataUpdate('elements.components');

    return true;
  }

  editComponent(name: string, parameters: Component['parameters']) {
    const component = this.data.elements.components[name];
    if (!component) return false;

    component.parameters = parameters;

    this.triggerDataUpdate('elements.components');

    return true;
  }

  renameComponent(name: string, newName: string) {
    const component = this.data.elements.components[name];
    if (!component) return false;

    this.data.elements.components[newName] = component;

    delete this.data.elements.components[name];

    this.triggerDataUpdate('elements.components');

    return true;
  }

  removeComponent(name: string) {
    const component = this.data.elements.components[name];
    if (!component) return false;

    delete this.data.elements.components[name];

    this.triggerDataUpdate('elements.components');

    return true;
  }

  setScale(value: number) {
    this.data.scale = value;

    this.triggerDataUpdate('scale');

    return true;
  }
}
