import { Point } from '@renderer/types/graphics';
import { StateMachine } from './StateMachine';
import { State } from '../drawable/State';
import { CreateTransitionParameters } from '@renderer/types/StateMachine';
import { Transition } from '../drawable/Transition';
import { ChangeTransitionParameters } from '@renderer/types/EditorManager';

type Action = { redo: () => void; undo: () => void };
type Stack = Array<Action>;

export const possibleActions = {
  stateCreate: (
    stateMachine: StateMachine,
    newStateId: string,
    name: string,
    position: Point,
    parentId?: string
  ) => {
    return {
      redo: stateMachine.createState.bind(
        stateMachine,
        { name, position, parentId, id: newStateId },
        false
      ),
      undo: stateMachine.deleteState.bind(stateMachine, newStateId, false),
    };
  },

  deleteState: (stateMachine: StateMachine, id: string, state: State) => {
    return {
      redo: stateMachine.deleteState.bind(stateMachine, id, false),
      undo: stateMachine.createState.bind(
        stateMachine,
        {
          name: state.data.name,
          id,
          position: {
            x: state.data.bounds.x + state.data.bounds.width / 2,
            y: state.data.bounds.y + state.data.bounds.height / 2,
          },
          parentId: state.data.parent,
        },
        false
      ),
    };
  },

  changeStateName: (stateMachine: StateMachine, id: string, name: string, state: State) => {
    return {
      redo: stateMachine.changeStateName.bind(stateMachine, id, name, false),
      undo: stateMachine.changeStateName.bind(stateMachine, id, state.data.name, false),
    };
  },

  createTransition: (
    stateMachine: StateMachine,
    id: string,
    params: CreateTransitionParameters
  ) => {
    return {
      redo: stateMachine.createTransition.bind(stateMachine, { ...params, id }, false),
      undo: stateMachine.deleteTransition.bind(stateMachine, id, false),
    };
  },

  deleteTransition: (stateMachine: StateMachine, transition: Transition) => {
    const prevData = structuredClone(transition.data);
    const id = transition.id;
    const source = transition.source;
    const target = transition.target;

    return {
      redo: stateMachine.deleteTransition.bind(stateMachine, transition.id, false),
      undo: stateMachine.createTransition.bind(
        stateMachine,
        {
          id,
          source,
          target,
          color: prevData.color,
          component: prevData.trigger.component,
          method: prevData.trigger.method,
          condition: prevData.condition!,
          doAction: prevData.do!,
        },
        false
      ),
    };
  },

  changeTransition: (
    stateMachine: StateMachine,
    transition: Transition,
    args: ChangeTransitionParameters
  ) => {
    const prevArgs = {
      id: transition.id,
      color: transition.data.color,
      component: transition.data.trigger.component,
      method: transition.data.trigger.method,
      doAction: structuredClone(transition.data.do!),
      condition: structuredClone(transition.data.condition!),
    };
    return {
      redo: stateMachine.changeTransition.bind(stateMachine, args, false),
      undo: stateMachine.changeTransition.bind(stateMachine, prevArgs, false),
    };
  },

  changeInitialState: (stateMachine: StateMachine, id: string, prevInitial: string) => {
    return {
      redo: stateMachine.changeInitialState.bind(stateMachine, id, false),
      undo: stateMachine.changeInitialState.bind(stateMachine, prevInitial, false),
    };
  },

  changeStatePosition: (
    stateMachine: StateMachine,
    id: string,
    startPosition: Point,
    endPosition: Point
  ) => {
    return {
      redo: stateMachine.changeStatePosition.bind(
        stateMachine,
        id,
        startPosition,
        endPosition,
        false
      ),
      undo: stateMachine.changeStatePosition.bind(
        stateMachine,
        id,
        endPosition,
        startPosition,
        false
      ),
    };
  },

  changeTransitionPosition: (
    stateMachine: StateMachine,
    id: string,
    startPosition: Point,
    endPosition: Point
  ) => {
    return {
      redo: stateMachine.changeTransitionPosition.bind(
        stateMachine,
        id,
        startPosition,
        endPosition,
        false
      ),
      undo: stateMachine.changeTransitionPosition.bind(
        stateMachine,
        id,
        endPosition,
        startPosition,
        false
      ),
    };
  },
};

export class UndoRedo {
  undoStack = [] as Stack;
  redoStack = [] as Stack;

  do(action: Action) {
    this.redoStack.length = 0;

    this.undoStack.push(action);
  }

  undo = () => {
    if (this.isUndoStackEmpty()) return;

    const action = this.undoStack.pop() as Action;

    action.undo();

    this.redoStack.push(action);
  };

  redo = () => {
    if (this.isRedoStackEmpty()) return;

    const action = this.redoStack.pop() as Action;

    action.redo();

    this.undoStack.push(action);
  };

  isUndoStackEmpty() {
    return this.undoStack.length === 0;
  }

  isRedoStackEmpty() {
    return this.redoStack.length === 0;
  }
}
