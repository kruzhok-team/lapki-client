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
  CreateFinalStateParams,
  CreateChoiceStateParams,
  SwapComponentsParams,
} from '@renderer/lib/types';
import { generateId } from '@renderer/lib/utils';
import {
  Event,
  Action,
  Transition as TransitionData,
  Component,
  Elements,
  EventData,
  Meta,
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

  constructor(private initPlatform: () => void, private resetEditor: () => void) {}

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

    this.initPlatform(); // TODO(bryzZz) Платформа непонятно где вообще в архитектуре, судя по всему ее нужно переносить в данные
    this.triggerDataUpdate('basename', 'name', 'elements', 'isStale', 'isInitialized');

    if (this.data.isMounted) {
      this.resetEditor();
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
      color,
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
      parentId,
      color,
    };

    this.triggerDataUpdate('elements.states');

    return id;
  }

  changeStateEvents(args: ChangeStateEventsParams) {
    const {
      id,
      eventData: { do: actions, trigger, condition },
      color,
    } = args;

    const state = this.data.elements.states[id];
    if (!state) return false;

    const eventIndex = state.events.findIndex(
      (value) =>
        trigger.component === value.trigger.component &&
        trigger.method === value.trigger.method &&
        undefined === value.trigger.args // FIXME: сравнение по args может не работать
    );
    const event = state.events[eventIndex];

    if (event === undefined) {
      state.events = [...state.events, args.eventData];
    } else {
      if (actions.length) {
        event.condition = condition;
        event.do = [...actions];
      } else {
        state.events.splice(eventIndex, 1);
      }
    }

    state.color = color;

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

  createInitialState(args: CreateInitialStateParams) {
    const { id = generateId(this.getNodeIds()), ...other } = args;

    this.data.elements.initialStates[id] = other;

    this.triggerDataUpdate('elements.initialStates');

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

  createFinalState(args: CreateFinalStateParams) {
    const { id = generateId(this.getNodeIds()), placeInCenter = false, position, ...other } = args;

    const centerPosition = () => {
      const size = 50;
      return {
        x: position.x - size / 2,
        y: position.y - size / 2,
      };
    };

    this.data.elements.finalStates[id] = {
      ...other,
      position: placeInCenter ? centerPosition() : position,
    };

    this.triggerDataUpdate('elements.finalStates');

    return id;
  }

  deleteFinalState(id: string) {
    const state = this.data.elements.finalStates[id];
    if (!state) return false;

    delete this.data.elements.finalStates[id];

    this.triggerDataUpdate('elements.finalStates');

    return true;
  }

  changeFinalStatePosition(id: string, position: Point) {
    const state = this.data.elements.finalStates[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.finalStates');

    return true;
  }

  linkFinalState(stateId: string, parentId: string) {
    const state = this.data.elements.finalStates[stateId];
    const parent = this.data.elements.states[parentId];

    if (!state || !parent) return false;

    state.parentId = parentId;

    this.triggerDataUpdate('elements.finalStates');

    return true;
  }

  createChoiceState(args: CreateChoiceStateParams) {
    const { id = generateId(this.getNodeIds()), placeInCenter = false, position, ...other } = args;

    const centerPosition = () => {
      const size = 50;
      return {
        x: position.x - size / 2,
        y: position.y - size / 2,
      };
    };

    this.data.elements.choiceStates[id] = {
      ...other,
      position: placeInCenter ? centerPosition() : position,
    };

    this.triggerDataUpdate('elements.choiceStates');

    return id;
  }

  deleteChoiceState(id: string) {
    const state = this.data.elements.choiceStates[id];
    if (!state) return false;

    delete this.data.elements.choiceStates[id];

    this.triggerDataUpdate('elements.choiceStates');

    return true;
  }

  changeChoiceStatePosition(id: string, position: Point) {
    const state = this.data.elements.choiceStates[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.choiceStates');

    return true;
  }

  linkChoiceState(stateId: string, parentId: string) {
    const state = this.data.elements.choiceStates[stateId];
    const parent = this.data.elements.states[parentId];

    if (!state || !parent) return false;

    state.parentId = parentId;

    this.triggerDataUpdate('elements.choiceStates');

    return true;
  }

  changeChoiceStateSelection(id: string, selection: boolean) {
    const state = this.data.elements.choiceStates[id];
    if (!state) return false;

    state.selection = selection;

    this.triggerDataUpdate('elements.choiceStates');

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
    const { id, label, ...other } = args;

    const transition = this.data.elements.transitions[id] as TransitionData;
    if (!transition) return false;

    //* Для чего это сделано? ChangeTransitionParams не предполагает что у label будет position и при обновлении данных позиция слетает
    // Поэтому данные label нужно не просто перезаписать, а соединять с предыдущими
    const getNewLabel = () => {
      if (!label) return undefined;

      return { ...(transition.label ?? {}), ...label };
    };

    this.data.elements.transitions[id] = { ...other, label: getNewLabel() };

    this.triggerDataUpdate('elements.transitions');

    return true;
  }

  //TODO: Выделение пока будет так работать, в дальнейшем требуется доработка
  changeTransitionSelection(id: string, selection: boolean) {
    const transition = this.data.elements.transitions[id];
    if (!transition || !transition.label) return false;

    transition.selection = selection;

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
      console.error(['bad new component', name, type]);
      return false;
    }

    const getOrder = () => {
      const orders = Object.values(this.data.elements.components).map((c) => c.order);

      if (orders.length === 0) return 0;

      return Math.max(...orders) + 1;
    };

    this.data.elements.components[name] = {
      type,
      parameters,
      order: getOrder(),
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

  swapComponents(args: SwapComponentsParams) {
    const { name1, name2 } = args;

    const component1 = this.data.elements.components[name1];
    const component2 = this.data.elements.components[name2];
    if (!component1 || !component2) return false;

    [component1.order, component2.order] = [component2.order, component1.order];

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

  //TODO: (XidFanSan) Выделение пока будет так работать, в дальнейшем требуется доработка
  changeNoteSelection(id: string, selection: boolean) {
    const note = this.data.elements.notes[id];
    if (!note) return false;

    note.selection = selection;

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

  setMeta(meta: Meta) {
    this.data.elements.meta = meta;

    this.triggerDataUpdate('elements.meta');

    return true;
  }
}
