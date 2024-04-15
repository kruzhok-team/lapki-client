import { useSyncExternalStore } from 'react';

import { EventSelection } from '@renderer/lib/drawable';
import { stateStyle } from '@renderer/lib/styles';
import {
  emptyEditorData,
  emptyDataListeners,
  CreateStateParams,
  EditorData,
  EditorDataPropertyName,
  EditorDataReturn,
  CreateTransitionParams,
  ChangeTransitionParams,
  ChangeStateEventsParams,
  AddComponentParams,
  CreateNoteParams,
  Point,
  CreateInitialStateParams,
} from '@renderer/lib/types';
import { generateId } from '@renderer/lib/utils';
import {
  Event,
  Action,
  Transition as TransitionData,
  Component,
  Elements,
  EventData,
} from '@renderer/types/diagram';

import { FilesManager } from './FilesManager';
import { Serializer } from './Serializer';

/**
 * Класс-прослойка, обеспечивающий взаимодействие с React.
 */
export class EditorModel {
  data = emptyEditorData();
  dataListeners = emptyDataListeners; //! Подписчиков обнулять нельзя, react сам разбирается
  files = new FilesManager(this);
  serializer = new Serializer(this);

  resetEditor?: () => void;

  init(basename: string | null, name: string, elements: Elements) {
    this.data.isInitialized = false; // Для того чтобы весь интрфейс обновился
    this.triggerDataUpdate('isInitialized');

    const prevMounted = this.data.isMounted;

    this.data = emptyEditorData();
    this.data.basename = basename;
    this.data.name = name;
    this.data.elements = elements;
    this.data.isInitialized = true;
    this.data.isMounted = prevMounted;

    this.triggerDataUpdate('basename', 'name', 'elements', 'isStale', 'isInitialized');

    if (this.data.isMounted) {
      this.resetEditor?.();
    }
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

  triggerDataUpdate<T extends EditorDataPropertyName>(...propertyNames: T[]) {
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

  private getNodeIds() {
    return Object.keys(this.data.elements.states).concat(
      Object.keys(this.data.elements.initialStates)
    );
  }

  createState(args: CreateStateParams) {
    const {
      name,
      parentId,
      id = generateId(this.getNodeIds()),
      events = [],
      placeInCenter = false,
    } = args;
    let position = args.position;
    const { width, height } = stateStyle;

    const centerPosition = () => {
      return {
        x: position.x - width / 2,
        y: position.y - height / 2,
      };
    };

    position = placeInCenter ? centerPosition() : position;

    this.data.elements.states[id] = {
      position,
      dimensions: { width, height },
      events: events,
      name,
      parentId: parentId,
    };

    this.triggerDataUpdate('elements.states');

    return id;
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
    const state = this.data.elements.states[id];
    if (!state) return false;

    state.name = name;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeStateSelection(id: string, selection: boolean) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    state.selection = selection;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  changeStatePosition(id: string, position: Point) {
    const state = this.data.elements.states[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  linkState(parentId: string, childId: string) {
    const parent = this.data.elements.states[parentId];
    const child = this.data.elements.states[childId];

    if (!parent || !child) return false;

    child.parentId = parentId;

    this.triggerDataUpdate('elements.states');

    return true;
  }

  unlinkState(id: string) {
    const state = this.data.elements.states[id];

    if (!state || !state.parentId) return false;

    const parent = this.data.elements.states[state.parentId];

    if (!parent) return false;

    delete state.parentId;

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

  // TODO
  // changeInitialState(initialState: InitialState) {
  //   const state = this.data.elements.states[initialState.target];
  //   if (!state) return false;

  //   this.data.elements.initialState = initialState;

  //   this.triggerDataUpdate('elements.states');

  //   return true;
  // }

  // changeInitialStatePosition(position: Point) {
  //   if (!this.data.elements.initialState) return;

  //   this.data.elements.initialState.position = position;

  //   this.triggerDataUpdate('elements.initialState');

  //   return true;
  // }

  createInitialState(args: CreateInitialStateParams) {
    const { id = generateId(this.getNodeIds()), ...other } = args;

    this.data.elements.initialStates[id] = other;

    this.triggerDataUpdate('elements.states');

    return id;
  }

  deleteInitialState(id: string) {
    const state = this.data.elements.initialStates[id];
    if (!state) return false;

    delete this.data.elements.initialStates[id];

    this.triggerDataUpdate('elements.initialStates');

    return true;
  }

  changeInitialStatePosition(id: string, position: Point) {
    const state = this.data.elements.initialStates[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.initialStates');

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

  createTransition(args: CreateTransitionParams) {
    const { id = generateId(Object.keys(this.data.elements.transitions)), ...other } = args;

    this.data.elements.transitions[id] = other;

    this.triggerDataUpdate('elements.transitions');

    return id;
  }

  changeTransition(args: ChangeTransitionParams) {
    const { id, ...other } = args;

    const transition = this.data.elements.transitions[id] as TransitionData;
    if (!transition) return false;

    this.data.elements.transitions[id] = other;

    this.triggerDataUpdate('elements.transitions');

    return true;
  }

  //TODO: Выделение пока будет так работать, в дальнейшем требуется доработка
  changeTransitionSelection(id: string, selection: boolean) {
    const transition = this.data.elements.transitions[id];
    if (!transition || !transition.label) return false;

    transition.label.selection = selection;

    this.triggerDataUpdate('elements.states');
    return true;
  }

  changeTransitionPosition(id: string, position: Point) {
    const transition = this.data.elements.transitions[id];
    if (!transition || !transition.label) return false;

    transition.label.position = position;

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
    const transitionId = generateId(Object.keys(this.data.elements.transitions));
    this.data.elements.components[name] = {
      transitionId,
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

  createNote(params: CreateNoteParams) {
    const {
      id = generateId(Object.keys(this.data.elements.notes)),
      text,
      placeInCenter = false,
    } = params;
    let position = params.position;

    const centerPosition = () => {
      return {
        x: position.x - 200 / 2,
        y: position.y - 36 / 2,
      };
    };

    position = placeInCenter ? centerPosition() : position;

    this.data.elements.notes[id] = {
      text,
      position,
    };

    this.triggerDataUpdate('elements.notes');

    return id;
  }

  changeNoteText(id: string, text: string) {
    if (!this.data.elements.notes.hasOwnProperty(id)) return false;

    this.data.elements.notes[id].text = text;

    this.triggerDataUpdate('elements.notes');

    return true;
  }

  changeNotePosition(id: string, position: Point) {
    const note = this.data.elements.notes[id];
    if (!note) return false;

    note.position = position;

    this.triggerDataUpdate('elements.notes');

    return true;
  }

  deleteNote(id: string) {
    const note = this.data.elements.notes[id];
    if (!note) return false;

    delete this.data.elements.notes[id];

    this.triggerDataUpdate('elements.notes');

    return true;
  }

  // createInitialState(params: CreateInitialStateParams) {
  //   const {
  //     id = generateId(Object.keys(this.data.elements.initialStates)),
  //     stateId,
  //     position,
  //   } = params;

  //   this.data.elements.initialStates[id] = {

  //   };

  //   this.triggerDataUpdate('elements.notes');

  //   return newId;
  // }
}
