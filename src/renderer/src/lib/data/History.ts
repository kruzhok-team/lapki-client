import { useSyncExternalStore } from 'react';

import { EventSelection, Transition } from '@renderer/lib/drawable';
import {
  EditComponentParams,
  RemoveComponentParams,
  UnlinkStateParams,
} from '@renderer/lib/types/EditorController';
import {
  AddComponentParams,
  ChangeStateEventsParams,
  CreateTransitionParams,
  ChangeTransitionParams,
  CreateNoteParams,
  CreateStateParams,
  CreateFinalStateParams,
} from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { roundPoint } from '@renderer/lib/utils';
import {
  State as StateData,
  FinalState as FinalStateData,
  Transition as TransitionData,
  Note as NoteData,
  Action as EventAction,
  Event,
  Component,
  EventData,
} from '@renderer/types/diagram';

import { EditorController } from './EditorController';

export type PossibleActions = {
  createState: CreateStateParams & { newStateId: string };
  deleteState: { id: string; stateData: StateData };
  changeStateName: { id: string; name: string; prevName: string };
  changeStateEvents: { args: ChangeStateEventsParams; prevActions: EventAction[] };
  changeStatePosition: { id: string; startPosition: Point; endPosition: Point };
  linkState: { parentId: string; childId: string };
  unlinkState: { parentId: string; params: UnlinkStateParams };

  createInitialState: { id: string; targetId: string };
  deleteInitialState: { id: string; targetId: string };
  changeInitialStatePosition: { id: string; startPosition: Point; endPosition: Point };

  createFinalState: CreateFinalStateParams & { newStateId: string };
  deleteFinalState: { id: string; stateData: FinalStateData };
  changeFinalStatePosition: { id: string; startPosition: Point; endPosition: Point };

  createTransition: { id: string; params: CreateTransitionParams };
  deleteTransition: { transition: Transition; prevData: TransitionData };
  changeTransition: {
    transition: Transition;
    args: ChangeTransitionParams;
    prevData: TransitionData;
  };
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

  createNote: { id: string; params: CreateNoteParams };
  changeNotePosition: { id: string; startPosition: Point; endPosition: Point };
  changeNoteText: { id: string; text: string; prevText: string };
  deleteNote: { id: string; prevData: NoteData };
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
    sm: EditorController,
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
  createState: (sM, args) => ({
    redo: sM.states.createState.bind(
      sM.states,
      { ...args, id: args.newStateId, linkByPoint: false, canBeInitial: false },
      false
    ),
    undo: sM.states.deleteState.bind(sM.states, args.newStateId, false),
  }),
  deleteState: (sM, { id, stateData }) => ({
    redo: sM.states.deleteState.bind(sM.states, id, false),
    undo: sM.states.createState.bind(
      sM.states,
      {
        name: stateData.name,
        id,
        position: stateData.position,
        parentId: stateData.parentId,
        events: stateData.events,
        color: stateData.color,
        linkByPoint: false,
        canBeInitial: false,
      },
      false
    ),
  }),
  changeStateName: (sM, { id, name, prevName }) => ({
    redo: sM.states.changeStateName.bind(sM.states, id, name, false),
    undo: sM.states.changeStateName.bind(sM.states, id, prevName, false),
  }),
  changeStateEvents: (sM, { args, prevActions }) => ({
    redo: sM.states.changeStateEvents.bind(sM.states, args, false),
    undo: sM.states.changeStateEvents.bind(
      sM.states,
      {
        ...args,
        actions: prevActions,
      },
      false
    ),
  }),
  linkState: (sM, { parentId, childId }) => ({
    redo: sM.states.linkState.bind(sM.states, { parentId, childId, canBeInitial: false }, false),
    undo: sM.states.unlinkState.bind(sM.states, { id: childId }, false),
  }),
  unlinkState: (sM, { parentId, params }) => ({
    redo: sM.states.unlinkState.bind(sM.states, params, false),
    undo: sM.states.linkState.bind(sM.states, { parentId, childId: params.id }, false),
  }),
  changeStatePosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.states.changeStatePosition.bind(sM.states, id, startPosition, endPosition, false),
    undo: sM.states.changeStatePosition.bind(sM.states, id, endPosition, startPosition, false),
  }),

  createInitialState: (sM, args) => ({
    redo: sM.states.createInitialState.bind(sM.states, args, false),
    undo: sM.states.deleteInitialState.bind(sM.states, args, false),
  }),
  deleteInitialState: (sM, args) => ({
    redo: sM.states.deleteInitialState.bind(sM.states, args, false),
    undo: sM.states.createInitialState.bind(sM.states, args, false),
  }),
  changeInitialStatePosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.states.changeInitialStatePosition.bind(
      sM.states,
      id,
      startPosition,
      endPosition,
      false
    ),
    undo: sM.states.changeInitialStatePosition.bind(
      sM.states,
      id,
      endPosition,
      startPosition,
      false
    ),
  }),

  createFinalState: (sM, args) => ({
    redo: sM.states.createFinalState.bind(
      sM.states,
      { ...args, id: args.newStateId, linkByPoint: false, canBeInitial: false },
      false
    ),
    undo: sM.states.deleteFinalState.bind(sM.states, args.newStateId, false),
  }),
  deleteFinalState: (sM, { id, stateData }) => ({
    redo: sM.states.deleteFinalState.bind(sM.states, id, false),
    undo: sM.states.createFinalState.bind(
      sM.states,
      {
        id,
        position: stateData.position,
        parentId: stateData.parentId,
        linkByPoint: false,
      },
      false
    ),
  }),
  changeFinalStatePosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.states.changeFinalStatePosition.bind(sM.states, id, startPosition, endPosition, false),
    undo: sM.states.changeFinalStatePosition.bind(sM.states, id, endPosition, startPosition, false),
  }),

  createTransition: (sM, { id, params }) => ({
    redo: sM.transitions.createTransition.bind(sM.transitions, { ...params, id }, false),
    undo: sM.transitions.deleteTransition.bind(sM.transitions, id, false),
  }),
  deleteTransition: (sM, { transition, prevData }) => ({
    redo: sM.transitions.deleteTransition.bind(sM.transitions, transition.id, false),
    undo: sM.transitions.createTransition.bind(
      sM.transitions,
      {
        id: transition.id,
        ...prevData,
      },
      false
    ),
  }),
  changeTransition: (sM, { transition, args, prevData }) => ({
    redo: sM.transitions.changeTransition.bind(sM.transitions, args, false),
    undo: sM.transitions.changeTransition.bind(
      sM.transitions,
      {
        id: transition.id,
        ...prevData,
      },
      false
    ),
  }),
  changeTransitionPosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.transitions.changeTransitionPosition.bind(
      sM.transitions,
      id,
      startPosition,
      endPosition,
      false
    ),
    undo: sM.transitions.changeTransitionPosition.bind(
      sM.transitions,
      id,
      endPosition,
      startPosition,
      false
    ),
  }),

  changeEvent: (sM, { stateId, event, newValue, prevValue }) => ({
    redo: sM.states.changeEvent.bind(sM.states, stateId, event, newValue, false),
    undo: sM.states.changeEvent.bind(sM.states, stateId, event, prevValue, false),
  }),
  changeEventAction: (sM, { stateId, event, newValue, prevValue }) => ({
    redo: sM.states.changeEvent.bind(sM.states, stateId, event, newValue, false),
    undo: sM.states.changeEvent.bind(sM.states, stateId, event, prevValue, false),
  }),
  deleteEvent: (sM, { stateId, eventIdx, prevValue }) => ({
    redo: sM.states.deleteEvent.bind(sM.states, stateId, { eventIdx, actionIdx: null }, false),
    undo: sM.states.createEvent.bind(sM.states, stateId, prevValue, eventIdx),
  }),
  deleteEventAction: (sM, { stateId, event, prevValue }) => ({
    redo: sM.states.deleteEvent.bind(sM.states, stateId, event, false),
    undo: sM.states.createEventAction.bind(sM.states, stateId, event, prevValue),
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

  createNote: (sM, { id, params }) => ({
    redo: sM.notes.createNote.bind(sM.notes, { id, ...params }, false),
    undo: sM.notes.deleteNote.bind(sM.notes, id, false),
  }),
  changeNoteText: (sM, { id, text, prevText }) => ({
    redo: sM.notes.changeNoteText.bind(sM.notes, id, text, false),
    undo: sM.notes.changeNoteText.bind(sM.notes, id, prevText, false),
  }),
  changeNotePosition: (sM, { id, startPosition, endPosition }) => ({
    redo: sM.notes.changeNotePosition.bind(sM.notes, id, startPosition, endPosition, false),
    undo: sM.notes.changeNotePosition.bind(sM.notes, id, endPosition, startPosition, false),
  }),
  deleteNote: (sM, { id, prevData }) => ({
    redo: sM.notes.deleteNote.bind(sM.notes, id, false),
    undo: sM.notes.createNote.bind(sM.notes, { id, ...prevData }, false),
  }),
};

export const actionDescriptions: ActionDescriptions = {
  createState: (args) => ({
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
    description: `Id: "${args.childId}"\nId родителя: "${args.parentId}"`,
  }),
  unlinkState: (args) => ({
    name: 'Отсоединение состояния',
    description: `Id: "${args.params.id}"\nId родителя: "${args.parentId}"`,
  }),
  changeStatePosition: (args) => ({
    name: 'Перемещение состояния',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  createInitialState: () => ({
    name: 'Создание начального состояния',
    description: ``,
  }),
  deleteInitialState: () => ({
    name: 'Удаление начального состояния',
    description: ``,
  }),
  changeInitialStatePosition: (args) => ({
    name: 'Перемещение начального состояния',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  createFinalState: () => ({
    name: 'Создание конечного состояния',
    description: ``,
  }),
  deleteFinalState: () => ({
    name: 'Удаление конечного состояния',
    description: ``,
  }),
  changeFinalStatePosition: (args) => ({
    name: 'Перемещение конечного состояния',
    description: `Было: "${JSON.stringify(
      roundPoint(args.startPosition)
    )}"\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),

  createTransition: (args) => ({ name: 'Создание перехода', description: `Id: ${args.id}` }),
  deleteTransition: (args) => ({
    name: 'Удаление перехода',
    description: `Id: ${args.transition.id}`,
  }),
  changeTransition: (args) => ({ name: 'Изменение перехода', description: `Id: ${args.args.id}` }),
  changeTransitionPosition: (args) => ({
    name: 'Перемещение перехода',
    description: `Id: "${args.id}"\nБыло: ${JSON.stringify(
      roundPoint(args.startPosition)
    )}\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
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

  createNote: (args) => ({ name: 'Создание заметки', description: `Id: ${args.id}` }),
  changeNoteText: (args) => ({
    name: 'Изменение текста заметки',
    description: `ID: ${args.id}\nБыло: "${args.prevText}"\nСтало: "${args.text}"`,
  }),
  changeNotePosition: (args) => ({
    name: 'Перемещение заметки',
    description: `Id: "${args.id}"\nБыло: ${JSON.stringify(
      roundPoint(args.startPosition)
    )}\nСтало: ${JSON.stringify(roundPoint(args.endPosition))}`,
  }),
  deleteNote: (args) => ({
    name: 'Удаление заметки',
    description: `ID: ${args.id} Текст: ${args.prevData.text}`,
  }),
};

export const STACK_SIZE_LIMIT = 100;

export class History {
  undoStack = [] as Stack;
  redoStack = [] as Stack;

  private listeners = [] as (() => void)[];
  private cachedSnapshot = { undoStack: this.undoStack, redoStack: this.redoStack };

  constructor(private stateMachine: EditorController) {}

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

    this.updateSnapshot();
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
