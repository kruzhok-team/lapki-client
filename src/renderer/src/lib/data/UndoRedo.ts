import {
  Action as EventAction,
  Event,
  Component,
  Transition as TransitionData,
  EventData,
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
import { State } from '../drawable/State';
import { Transition } from '../drawable/Transition';

type PossibleActions = {
  stateCreate: CreateStateParameters & { newStateId: string };
  deleteState: { id: string; state: State };
  changeStateName: { id: string; name: string; state: State };
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
type PossibleActionTypes = keyof PossibleActions;
type Action<T extends PossibleActionTypes> = {
  type: T;
  args: PossibleActions[T];
  numberOfConnectedActions?: number;
};
type Stack = Array<Action<any>>;
type ActionFunctions = {
  [Type in PossibleActionTypes]: (
    sm: StateMachine,
    args: PossibleActions[Type]
  ) => { undo: () => void; redo: () => void };
};

export const actionFunctions: ActionFunctions = {
  stateCreate: (sM, args) => ({
    redo: sM.createState.bind(sM, { ...args, id: args.newStateId }, false),
    undo: sM.deleteState.bind(sM, args.newStateId, false),
  }),
  deleteState: (sM, { id, state }) => ({
    redo: sM.deleteState.bind(sM, id, false),
    undo: sM.createState.bind(
      sM,
      {
        name: state.data.name,
        id,
        position: {
          x: state.data.bounds.x + state.data.bounds.width / 2,
          y: state.data.bounds.y + state.data.bounds.height / 2,
        },
        parentId: state.data.parent,
        events: structuredClone(state.data.events),
      },
      false
    ),
  }),
  changeStateName: (sM, { id, name, state }) => ({
    redo: sM.changeStateName.bind(sM, id, name, false),
    undo: sM.changeStateName.bind(sM, id, state.data.name, false),
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
    undo: sM.createEvent.bind(sM, stateId, prevValue, false),
  }),
  deleteEventAction: (sM, { stateId, event, prevValue }) => ({
    redo: sM.deleteEvent.bind(sM, stateId, event, false),
    undo: sM.createEventAction.bind(sM, stateId, event, prevValue, false),
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

export const STACK_SIZE_LIMIT = 100;

export class UndoRedo {
  undoStack = [] as Stack;
  redoStack = [] as Stack;

  constructor(public stateMachine: StateMachine) {}

  do<T extends PossibleActionTypes>(action: Action<T>) {
    this.redoStack.length = 0;
    this.undoStack.push(action);
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
  };

  isUndoStackEmpty() {
    return this.undoStack.length === 0;
  }

  isRedoStackEmpty() {
    return this.redoStack.length === 0;
  }
}
