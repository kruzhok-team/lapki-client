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
  CreateComponentParams,
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

import { Serializer } from './Serializer';

/**
 * Класс-прослойка, обеспечивающий взаимодействие с React.
 */
export class EditorModel {
  data = emptyEditorData();
  dataListeners = emptyDataListeners; //! Подписчиков обнулять нельзя, react сам разбирается
  serializer = new Serializer(this);

  constructor(private initPlatform: () => void, private resetEditor: () => void) {}

  init(basename: string | null, name: string, elements: Elements) {
    this.triggerDataUpdate('canvas');
    this.data = emptyEditorData();
    this.data.basename = basename;
    this.data.name = name;
    this.data.elements = elements;
    for (const canvasId in this.data.canvas) {
      const canvas = this.data.canvas[canvasId];
      const prevMounted = canvas.isMounted;
      canvas.isInitialized = true;
      canvas.isMounted = prevMounted;
      if (canvas.isMounted) {
        this.resetEditor();
      }
    }

    this.initPlatform(); // TODO(bryzZz) Платформа непонятно где вообще в архитектуре, судя по всему ее нужно переносить в данные
    this.triggerDataUpdate('basename', 'name', 'elements');
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
    const ids: string[] = [];
    for (const smId in this.data.elements.stateMachines) {
      const sm = this.data.elements.stateMachines[smId];
      ids.push(...Object.keys(sm.states));
      ids.push(...Object.keys(sm.initialStates));
    }

    return ids;
  }

  createState(args: CreateStateParams) {
    const {
      name,
      parentId,
      id = generateId(this.getNodeIds()),
      events = args.events || [],
      placeInCenter = false,
      color,
      smId,
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

    this.data.elements.stateMachines[smId].states[id] = {
      position,
      dimensions: { width, height },
      events: events,
      name,
      parentId,
      color,
    };

    this.triggerDataUpdate('elements.stateMachines.states');

    return id;
  }

  changeStateEvents(args: ChangeStateEventsParams) {
    const {
      id,
      eventData: { do: actions, trigger, condition },
      color,
      smId,
    } = args;

    const state = this.data.elements.stateMachines[smId].states[id];
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

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  changeStateName(smId: string, id: string, name: string) {
    const state = this.data.elements.stateMachines[smId].states[id];
    if (!state) return false;

    state.name = name;

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  changeStateSelection(smId: string, id: string, selection: boolean) {
    const state = this.data.elements.stateMachines[smId].states[id];
    if (!state) return false;

    state.selection = selection;

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  changeStatePosition(smId: string, id: string, position: Point) {
    const state = this.data.elements.stateMachines[smId].states[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  linkState(smId: string, parentId: string, childId: string) {
    const parent = this.data.elements.stateMachines[smId].states[parentId];
    const child = this.data.elements.stateMachines[smId].states[childId];

    if (!parent || !child) return false;

    child.parentId = parentId;

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  unlinkState(smId: string, id: string) {
    const state = this.data.elements.stateMachines[smId].states[id];

    if (!state || !state.parentId) return false;

    const parent = this.data.elements.stateMachines[smId].states[state.parentId];

    if (!parent) return false;

    delete state.parentId;

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  deleteState(smId: string, id: string) {
    const state = this.data.elements.stateMachines[smId].states[id];
    if (!state) return false;

    delete this.data.elements.stateMachines[smId].states[id];

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  createInitialState(args: CreateInitialStateParams) {
    const { id = generateId(this.getNodeIds()), smId, ...other } = args;

    this.data.elements.stateMachines[smId].initialStates[id] = other;

    this.triggerDataUpdate('elements.stateMachines.initialStates');

    return id;
  }

  deleteInitialState(id: string, smId: string) {
    const state = this.data.elements.stateMachines[smId].initialStates[id];
    if (!state) return false;

    delete this.data.elements.stateMachines[smId].initialStates[id];

    this.triggerDataUpdate('elements.stateMachines.initialStates');

    return true;
  }

  changeInitialStatePosition(smId: string, id: string, position: Point) {
    const state = this.data.elements.stateMachines[smId].initialStates[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.stateMachines.initialStates');

    return true;
  }

  createFinalState(args: CreateFinalStateParams) {
    const {
      smId,
      id = generateId(this.getNodeIds()),
      placeInCenter = false,
      position,
      ...other
    } = args;

    const centerPosition = () => {
      const size = 50;
      return {
        x: position.x - size / 2,
        y: position.y - size / 2,
      };
    };

    this.data.elements.stateMachines[smId].finalStates[id] = {
      ...other,
      position: placeInCenter ? centerPosition() : position,
    };

    this.triggerDataUpdate('elements.stateMachines.finalStates');

    return id;
  }

  deleteFinalState(smId: string, id: string) {
    const state = this.data.elements.stateMachines[smId].finalStates[id];
    if (!state) return false;

    delete this.data.elements.stateMachines[smId].finalStates[id];

    this.triggerDataUpdate('elements.stateMachines.finalStates');

    return true;
  }

  changeFinalStatePosition(smId: string, id: string, position: Point) {
    const state = this.data.elements.stateMachines[smId].finalStates[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.stateMachines.finalStates');

    return true;
  }

  linkFinalState(smId: string, stateId: string, parentId: string) {
    const state = this.data.elements.stateMachines[smId].finalStates[stateId];
    const parent = this.data.elements.stateMachines[smId].states[parentId];

    if (!state || !parent) return false;

    state.parentId = parentId;

    this.triggerDataUpdate('elements.stateMachines.finalStates');

    return true;
  }

  createChoiceState(args: CreateChoiceStateParams) {
    const {
      smId,
      id = generateId(this.getNodeIds()),
      placeInCenter = false,
      position,
      ...other
    } = args;

    const centerPosition = () => {
      const size = 50;
      return {
        x: position.x - size / 2,
        y: position.y - size / 2,
      };
    };

    this.data.elements.stateMachines[smId].choiceStates[id] = {
      ...other,
      position: placeInCenter ? centerPosition() : position,
    };

    this.triggerDataUpdate('elements.stateMachines.choiceStates');

    return id;
  }

  deleteChoiceState(smId: string, id: string) {
    const state = this.data.elements.stateMachines[smId].choiceStates[id];
    if (!state) return false;

    delete this.data.elements.stateMachines[smId].choiceStates[id];

    this.triggerDataUpdate('elements.stateMachines.choiceStates');

    return true;
  }

  changeChoiceStatePosition(smId: string, id: string, position: Point) {
    const state = this.data.elements.stateMachines[smId].choiceStates[id];
    if (!state) return false;

    state.position = position;

    this.triggerDataUpdate('elements.stateMachines.choiceStates');

    return true;
  }

  linkChoiceState(smId: string, stateId: string, parentId: string) {
    const state = this.data.elements.stateMachines[smId].choiceStates[stateId];
    const parent = this.data.elements.stateMachines[smId].states[parentId];

    if (!state || !parent) return false;

    state.parentId = parentId;

    this.triggerDataUpdate('elements.stateMachines.choiceStates');

    return true;
  }

  changeChoiceStateSelection(smId: string, id: string, selection: boolean) {
    const state = this.data.elements.stateMachines[smId].choiceStates[id];
    if (!state) return false;

    state.selection = selection;

    this.triggerDataUpdate('elements.stateMachines.choiceStates');

    return true;
  }

  createEvent(smId: string, stateId: string, eventData: EventData, eventIdx?: number) {
    const state = this.data.elements.stateMachines[smId].states[stateId];
    if (!state) return false;

    if (eventIdx !== undefined) {
      state.events.splice(eventIdx, 0, eventData);
    } else {
      state.events.push(eventData);
    }

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  createEventAction(smId: string, stateId: string, event: EventSelection, value: Action) {
    const state = this.data.elements.stateMachines[smId].states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do.splice(actionIdx ?? state.events[eventIdx].do.length - 1, 0, value);

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  changeEvent(smId: string, stateId: string, eventIdx: number, newValue: Event) {
    const state = this.data.elements.stateMachines[smId].states[stateId];
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

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  changeEventAction(smId: string, stateId: string, event: EventSelection, newValue: Action) {
    const state = this.data.elements.stateMachines[smId].states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do[actionIdx as number] = newValue;

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  deleteEvent(smId: string, stateId: string, eventIdx: number) {
    const state = this.data.elements.stateMachines[smId].states[stateId];
    if (!state) return false;

    state.events.splice(eventIdx, 1);

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  deleteEventAction(smId: string, stateId: string, event: EventSelection) {
    const state = this.data.elements.stateMachines[smId].states[stateId];
    if (!state) return false;

    const { eventIdx, actionIdx } = event;

    state.events[eventIdx].do.splice(actionIdx as number, 1);

    this.triggerDataUpdate('elements.stateMachines.states');

    return true;
  }

  createTransition(args: CreateTransitionParams) {
    const {
      smId,
      id = generateId(Object.keys(this.data.elements.stateMachines[smId].transitions)),
      ...other
    } = args;

    this.data.elements.stateMachines[smId].transitions[id] = other;

    this.triggerDataUpdate('elements.stateMachines.transitions');

    return id;
  }

  changeTransition(args: ChangeTransitionParams) {
    const { id, smId, label, ...other } = args;

    const transition = this.data.elements.stateMachines[smId].transitions[id] as TransitionData;
    if (!transition) return false;

    //* Для чего это сделано? ChangeTransitionParams не предполагает что у label будет position и при обновлении данных позиция слетает
    // Поэтому данные label нужно не просто перезаписать, а соединять с предыдущими
    const getNewLabel = () => {
      if (!label) return undefined;

      return { ...(transition.label ?? {}), ...label };
    };

    this.data.elements.stateMachines[smId].transitions[id] = { ...other, label: getNewLabel() };

    this.triggerDataUpdate('elements.stateMachines.transitions');

    return true;
  }

  //TODO: Выделение пока будет так работать, в дальнейшем требуется доработка
  changeTransitionSelection(smId: string, id: string, selection: boolean) {
    const transition = this.data.elements.stateMachines[smId].transitions[id];
    if (!transition || !transition.label) return false;

    transition.selection = selection;

    this.triggerDataUpdate('elements.stateMachines.states');
    return true;
  }

  changeTransitionPosition(smId: string, id: string, position: Point) {
    const transition = this.data.elements.stateMachines[smId].transitions[id];
    if (!transition || !transition.label) return false;

    transition.label.position = position;

    this.triggerDataUpdate('elements.stateMachines.transitions');

    return true;
  }

  deleteTransition(smId: string, id: string) {
    const transition = this.data.elements.stateMachines[smId].transitions[id];
    if (!transition) return false;

    delete this.data.elements.stateMachines[smId].transitions[id];

    this.triggerDataUpdate('elements.stateMachines.transitions');

    return true;
  }

  createComponent(args: CreateComponentParams) {
    const { smId, name, type, placeInCenter = false, position, parameters } = args;

    const centerPosition = () => {
      const size = 50;
      return {
        x: position.x - size / 2,
        y: position.y - size / 2,
      };
    };

    if (this.data.elements.stateMachines[smId].components.hasOwnProperty(name)) {
      console.error(['bad new component', name, type]);
      return name;
    }

    const getOrder = () => {
      const orders = Object.values(this.data.elements.stateMachines[smId].components).map(
        (c) => c.order
      );

      if (orders.length === 0) return 0;

      return Math.max(...orders) + 1;
    };

    this.data.elements.stateMachines[smId].components[name] = {
      type,
      position: placeInCenter ? centerPosition() : position,
      parameters,
      order: getOrder(),
    };

    this.triggerDataUpdate('elements.stateMachines.components');

    return name;
  }

  editComponent(smId: string, name: string, parameters: Component['parameters']) {
    const component = this.data.elements.stateMachines[smId].components[name];
    if (!component) return false;

    component.parameters = parameters;

    this.triggerDataUpdate('elements.stateMachines.components');

    return true;
  }

  changeComponentName(smId: string, name: string, newName: string) {
    const component = this.data.elements.stateMachines[smId].components[name];
    if (!component) return false;

    this.data.elements.stateMachines[smId].components[newName] = component;

    delete this.data.elements.stateMachines[smId].components[name];

    this.triggerDataUpdate('elements.stateMachines.components');

    return true;
  }

  deleteComponent(smId: string, name: string) {
    const component = this.data.elements.stateMachines[smId].components[name];
    if (!component) return false;

    delete this.data.elements.stateMachines[smId].components[name];

    this.triggerDataUpdate('elements.stateMachines.components');

    return true;
  }

  swapComponents(smId: string, args: SwapComponentsParams) {
    const { name1, name2 } = args;

    const component1 = this.data.elements.stateMachines[smId].components[name1];
    const component2 = this.data.elements.stateMachines[smId].components[name2];
    if (!component1 || !component2) return false;

    [component1.order, component2.order] = [component2.order, component1.order];

    this.triggerDataUpdate('elements.stateMachines.components');

    return true;
  }

  changeComponentPosition(name: string, smId: string, position: Point) {
    const component = this.data.elements.stateMachines[smId].components[name];
    if (!component) return false;

    component.position = position;

    this.triggerDataUpdate('elements.stateMachines.components');

    return true;
  }

  changeComponentSelection(smId: string, name: string, selection: boolean) {
    const component = this.data.elements.stateMachines[smId].components[name];
    if (!component) return false;

    component.selection = selection;

    this.triggerDataUpdate('elements.stateMachines.components');

    return true;
  }

  setScale(value: number) {
    this.data.scale = value;

    this.triggerDataUpdate('scale');

    return true;
  }

  createNote(params: CreateNoteParams) {
    const {
      smId,
      id = generateId(Object.keys(this.data.elements.stateMachines[smId].notes)),
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

    this.data.elements.stateMachines[smId].notes[id] = {
      text,
      position,
    };

    this.triggerDataUpdate('elements.stateMachines.notes');

    return id;
  }

  changeNoteText(smId: string, id: string, text: string) {
    if (!this.data.elements.stateMachines[smId].notes.hasOwnProperty(id)) return false;

    this.data.elements.stateMachines[smId].notes[id].text = text;

    this.triggerDataUpdate('elements.stateMachines.notes');

    return true;
  }

  //TODO: (XidFanSan) Выделение пока будет так работать, в дальнейшем требуется доработка
  changeNoteSelection(smId: string, id: string, selection: boolean) {
    const note = this.data.elements.stateMachines[smId].notes[id];
    if (!note) return false;

    note.selection = selection;

    this.triggerDataUpdate('elements.stateMachines.notes');

    return true;
  }

  changeNotePosition(smId: string, id: string, position: Point) {
    const note = this.data.elements.stateMachines[smId].notes[id];
    if (!note) return false;

    note.position = position;

    this.triggerDataUpdate('elements.stateMachines.notes');

    return true;
  }

  deleteNote(smId: string, id: string) {
    const note = this.data.elements.stateMachines[smId].notes[id];
    if (!note) return false;

    delete this.data.elements.stateMachines[smId].notes[id];

    this.triggerDataUpdate('elements.stateMachines.notes');

    return true;
  }

  setMeta(smId: string, meta: Meta) {
    this.data.elements.stateMachines[smId].meta = meta;

    this.triggerDataUpdate('elements.stateMachines.meta');

    return true;
  }
}
