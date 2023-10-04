import { useSyncExternalStore } from 'react';

import {
  Action as EventAction,
  Event,
  Component,
  Transition as TransitionData,
  EventData,
  State as StateData,
} from '@renderer/types/diagram';
import {
  AddComponentParams,
  ChangeStateEventsParams,
  ChangeTransitionParameters,
  CreateStateParameters,
} from '@renderer/types/EditorManager';
import { Point } from '@renderer/types/graphics';
import {
  CreateTransitionParameters,
  EditComponentParams,
  RemoveComponentParams,
} from '@renderer/types/StateMachine';

import { StateMachine } from './StateMachine';

import { EventSelection } from '../drawable/Events';
import { Transition } from '../drawable/Transition';

export type PossibleActions = {
  stateCreate: CreateStateParameters & { newStateId: string };
  deleteState: { id: string; stateData: StateData };
  changeStateName: { id: string; name: string; prevName: string };
  changeStateEvents: { args: ChangeStateEventsParams; prevActions: EventAction[] };
  linkState: { parentId: string; childId: string };
  unlinkState: { parentId: string; childId: string };
  createTransition: { id: string; params: CreateTransitionParameters };
  deleteTransition: { transition: Transition; prevData: TransitionData };
  changeTransition: {
    transition: Transition;
    args: ChangeTransitionParameters;
    prevData: TransitionData;
  };
  changeInitialState: { id: string; prevInitial: string };
  changeStatePosition: { id: string; startPosition: Point; endPosition: Point };
  changeTransitionPosition: { id: string; startPosition: Point; endPosition: Point };
  changeEvent: { stateId: string; event: EventSelection; newValue: Event; prevValue: Event };
  changeEventAction: {
    stateId: string;
    event: EventSelection;
    newValue: EventAction;
    prevValue: EventAction;
  };
  deleteEvent: { stateId: string; eventIdx: number; prevValue: EventData };
  deleteEventAction: { stateId: string; event: EventSelection; prevValue: EventAction };
  addComponent: { args: AddComponentParams };
  removeComponent: { args: RemoveComponentParams; prevComponent: Component };
  editComponent: { args: EditComponentParams; prevComponent: Component };
};
export type PossibleActionTypes = keyof PossibleActions;
export type Action<T extends PossibleActionTypes> = {
  type: T;
  args: PossibleActions[T];
  numberOfConnectedActions?: number;
};
export type Stack = Array<Action<any>>;
type ActionFunctions = {
  [Type in PossibleActionTypes]: (
    sm: StateMachine,
    args: PossibleActions[Type]
  ) => { undo: () => void; redo: () => void };
};
type ActionDescriptions = {
  [Type in PossibleActionTypes]: (args: PossibleActions[Type]) => {
    name: string;
    description: string;
  };
};

export const actionFunctions: ActionFunctions = {
  stateCreate: (sM, args) => ({
    redo: sM.createState.bind(sM, { ...args, id: args.newStateId }, false),
    undo: sM.deleteState.bind(sM, args.newStateId, false),
  }),
  deleteState: (sM, { id, stateData }) => ({
    redo: sM.deleteState.bind(sM, id, false),
    undo: sM.createState.bind(
      sM,
      {
        name: stateData.name,
        id,
        position: {
          x: stateData.bounds.x + stateData.bounds.width / 2,
          y: stateData.bounds.y + stateData.bounds.height / 2,
        },
        parentId: stateData.parent,
        events: stateData.events,
      },
      false
    ),
  }),
  changeStateName: (sM, { id, name, prevName }) => ({
    redo: sM.changeStateName.bind(sM, id, name, false),
    undo: sM.changeStateName.bind(sM, id, prevName, false),
  }),
  changeStateEvents: (sM, { args, prevActions }) => ({
    redo: sM.changeStateEvents.bind(sM, args, false),
    undo: sM.changeStateEvents.bind(
      sM,
      {
        ...args,
        actions: prevActions,
      },
      false
    ),
  }),
  linkState: (sM, { parentId, childId }) => ({
    redo: sM.linkState.bind(sM, parentId, childId, false),
    undo: sM.unlinkState.bind(sM, childId, false),
  }),
  unlinkState: (sM, { parentId, childId }) => ({
    redo: sM.unlinkState.bind(sM, childId, false),
    undo: sM.linkState.bind(sM, parentId, childId, false),
  }),
  createTransition: (sM, { id, params }) => ({
    redo: sM.createTransition.bind(sM, { ...params, id }, false),
    undo: sM.deleteTransition.bind(sM, id, false),
  }),
  deleteTransition: (sM, { transition, prevData }) => ({
    redo: sM.deleteTransition.bind(sM, transition.id, false),
    undo: sM.createTransition.bind(
      sM,
      {
        id: transition.id,
        ...prevData,
        component: prevData.trigger.component,
        method: prevData.trigger.method,
        condition: prevData.condition!,
        doAction: prevData.do!,
      },
      false
    ),
  }),
  changeTransition: (sM, { transition, args, prevData }) => ({
    redo: sM.changeTransition.bind(sM, args, false),
    undo: sM.changeTransition.bind(
      sM,
      {
        id: transition.id,
        color: prevData.color,
        component: prevData.trigger.component,
        method: prevData.trigger.method,
        doAction: prevData.do!,
        condition: prevData.condition!,
      },
      false
    ),
  }),
  changeInitialState: (sM, { id, prevInitial }) => ({
    redo: sM.changeInitialState.bind(sM, id, false),
    undo: sM.changeInitialState.bind(sM, prevInitial, false),
  }),
  changeStatePosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.changeStatePosition.bind(sM, id, startPosition, endPosition, false),
    undo: sM.changeStatePosition.bind(sM, id, endPosition, startPosition, false),
  }),
  changeTransitionPosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.changeTransitionPosition.bind(sM, id, startPosition, endPosition, false),
    undo: sM.changeTransitionPosition.bind(sM, id, endPosition, startPosition, false),
  }),
  changeEvent: (sM, { stateId, event, newValue, prevValue }) => ({
    redo: sM.changeEvent.bind(sM, stateId, event, newValue, false),
    undo: sM.changeEvent.bind(sM, stateId, event, prevValue, false),
  }),
  changeEventAction: (sM, { stateId, event, newValue, prevValue }) => ({
    redo: sM.changeEvent.bind(sM, stateId, event, newValue, false),
    undo: sM.changeEvent.bind(sM, stateId, event, prevValue, false),
  }),
  deleteEvent: (sM, { stateId, eventIdx, prevValue }) => ({
    redo: sM.deleteEvent.bind(sM, stateId, { eventIdx, actionIdx: null }, false),
    undo: sM.createEvent.bind(sM, stateId, prevValue, eventIdx),
  }),
  deleteEventAction: (sM, { stateId, event, prevValue }) => ({
    redo: sM.deleteEvent.bind(sM, stateId, event, false),
    undo: sM.createEventAction.bind(sM, stateId, event, prevValue),
  }),
  addComponent: (sM, { args }) => ({
    redo: sM.addComponent.bind(sM, args, false),
    undo: sM.removeComponent.bind(sM, { name: args.name, purge: false }, false),
  }),
  removeComponent: (sM, { args, prevComponent }) => ({
    redo: sM.removeComponent.bind(sM, args, false),
    undo: sM.addComponent.bind(sM, { name: args.name, ...prevComponent }, false),
  }),
  editComponent: (sM, { args, prevComponent }) => ({
    redo: sM.editComponent.bind(sM, args, false),
    undo: sM.editComponent.bind(
      sM,
      {
        name: args.newName ?? args.name,
        parameters: prevComponent.parameters,
        newName: args.newName ? args.name : undefined,
      },
      false
    ),
  }),
};

export const actionDescriptions: ActionDescriptions = {
  stateCreate: (args) => ({
    name: 'Создание состояния',
    description: `Имя: ${args.name}`,
  }),
  deleteState: (args) => ({
    name: 'Удаление состояния',
    description: `Имя: ${args.stateData.name}`,
  }),
  changeStateName: (args) => ({
    name: 'Изменение имени состояния',
    description: `Было: "${args.prevName}"\nСтало: "${args.name}"`,
  }),
  changeStateEvents: ({ args, prevActions }) => ({
    name: 'Изменение состояния',
    description: `Id состояния: ${args.id}\nТриггер: ${args.triggerComponent}\nМетод: ${
      args.triggerMethod
    }\nБыло: ${JSON.stringify(prevActions)}\nСтало: ${JSON.stringify(args.actions)}`,
  }),
  linkState: (args) => ({
    name: 'Присоединение состояния',
    description: `Id: "${args.childId}"\nId родителя: "${args.childId}"`,
  }),
  unlinkState: (args) => ({
    name: 'Отсоединение состояния',
    description: `Id: "${args.childId}"\nId родителя: "${args.childId}"`,
  }),
  createTransition: (args) => ({ name: 'Создание перехода', description: `Id: ${args.id}` }),
  deleteTransition: (args) => ({
    name: 'Удаление перехода',
    description: `Id: ${args.transition.id}`,
  }),
  changeTransition: (args) => ({ name: 'Изменение перехода', description: `Id: ${args.args.id}` }),
  changeInitialState: (args) => ({
    name: 'Изменение начального состояния',
    description: `Было: "${args.prevInitial}"\nСтало: ${args.id}`,
  }),
  changeStatePosition: (args) => ({
    name: 'Перемещение состояния',
    description: `Id: "${args.id}"\nБыло: ${JSON.stringify(
      args.startPosition
    )}\nСтало: ${JSON.stringify(args.endPosition)}`,
  }),
  changeTransitionPosition: (args) => ({
    name: 'Перемещение перехода',
    description: `Id: "${args.id}"\nБыло: ${JSON.stringify(
      args.startPosition
    )}\nСтало: ${JSON.stringify(args.endPosition)}`,
  }),
  changeEvent: (args) => ({
    name: 'Изменение события состояния',
    description: `Id состояния: ${args.stateId}\nПозиция: ${JSON.stringify(
      args.event
    )}\nБыло: ${JSON.stringify(args.prevValue)}\nСтало: ${JSON.stringify(args.newValue)}`,
  }),
  changeEventAction: (args) => ({
    name: 'Изменение действия в событии',
    description: `Id состояния: ${args.stateId}\nПозиция: ${JSON.stringify(
      args.event
    )}\nБыло: ${JSON.stringify(args.prevValue)}\nСтало: ${JSON.stringify(args.newValue)}`,
  }),
  deleteEvent: (args) => ({
    name: 'Удаление события',
    description: `Id состояния: ${args.stateId}\nПозиция: ${args.eventIdx}`,
  }),
  deleteEventAction: (args) => ({
    name: 'Удаление действия в событии',
    description: `Id состояния: ${args.stateId}\nПозиция: ${JSON.stringify(args.event)}`,
  }),
  addComponent: ({ args }) => ({
    name: 'Добавление компонента',
    description: `Имя: ${args.name}\nТип: ${args.type}`,
  }),
  removeComponent: ({ args, prevComponent }) => ({
    name: 'Удаление компонента',
    description: `Имя: ${args.name}\nТип: ${prevComponent.type}`,
  }),
  editComponent: ({ args, prevComponent }) => {
    const prev = { prevComponent, name: args.name };
    const newComp = { ...args, type: prevComponent.type };
    delete newComp.newName;

    return {
      name: 'Изменение компонента',
      description: `Было: ${JSON.stringify(prev)}\nСтало: ${JSON.stringify(newComp)}`,
    };
  },
};

export const STACK_SIZE_LIMIT = 100;

export class UndoRedo {
  undoStack = [] as Stack;
  redoStack = [] as Stack;

  private listeners = [] as (() => void)[];
  private cachedSnapshot = { undoStack: this.undoStack, redoStack: this.redoStack };

  constructor(public stateMachine: StateMachine) {}

  do<T extends PossibleActionTypes>(action: Action<T>) {
    this.redoStack.length = 0;
    this.undoStack.push(action);

    // Проверка на лимит
    if (this.undoStack.length > STACK_SIZE_LIMIT) {
      this.undoStack.shift();
    }

    this.updateSnapshot();
  }

  undo = () => {
    if (this.isUndoStackEmpty()) return;

    const action = this.undoStack.pop() as Action<any>;

    actionFunctions[action.type](this.stateMachine, action.args).undo();

    if (action.numberOfConnectedActions) {
      for (let i = 0; i < action.numberOfConnectedActions; i++) {
        this.undo();
      }
    }

    // Если соединённые действия то первое должно попасть в конец redo стека
    this.redoStack.push(action);

    this.updateSnapshot();
  };

  redo = () => {
    if (this.isRedoStackEmpty()) return;

    const action = this.redoStack.pop() as Action<any>;

    actionFunctions[action.type](this.stateMachine, action.args).redo();

    if (action.numberOfConnectedActions) {
      for (let i = 0; i < action.numberOfConnectedActions; i++) {
        this.redo();
      }
    }

    // Если соединённые действия то первое должно попасть в конец undo стека
    this.undoStack.push(action);

    // Проверка на лимит
    if (this.undoStack.length > STACK_SIZE_LIMIT) {
      this.undoStack.shift();
    }

    this.updateSnapshot();
  };

  isUndoStackEmpty() {
    return this.undoStack.length === 0;
  }

  isRedoStackEmpty() {
    return this.redoStack.length === 0;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  private updateSnapshot = () => {
    this.cachedSnapshot = { undoStack: this.undoStack, redoStack: this.redoStack };
    this.listeners.forEach((l) => l());
  };

  private subscribe = (listener: () => void) => {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  };

  use = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(this.subscribe, () => this.cachedSnapshot);
  };
}
