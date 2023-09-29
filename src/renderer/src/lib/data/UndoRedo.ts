import { Point } from '@renderer/types/graphics';
import { StateMachine } from './StateMachine';
import { State } from '../drawable/State';
import {
  CreateTransitionParameters,
  EditComponentParams,
  RemoveComponentParams,
} from '@renderer/types/StateMachine';
import { Transition } from '../drawable/Transition';
import {
  AddComponentParams,
  ChangeStateEventsParams,
  ChangeTransitionParameters,
  CreateStateParameters,
} from '@renderer/types/EditorManager';
import { Action as EventAction, Event, Component } from '@renderer/types/diagram';

type Action = {
  redo: () => void;
  undo: () => void;
  numberOfConnectedActions?: number;
  description?: string;
};
type Stack = Array<Action>;

export const getPossibleActions = (stateMachine: StateMachine) => {
  return {
    stateCreate: (
      newStateId: string,
      args: CreateStateParameters,
      numberOfConnectedActions = 0
    ) => {
      return {
        redo: stateMachine.createState.bind(stateMachine, { ...args, id: newStateId }, false),
        undo: stateMachine.deleteState.bind(stateMachine, newStateId, false),
        numberOfConnectedActions,
        description: 'stateCreate',
      };
    },

    deleteState: (id: string, state: State, numberOfConnectedActions = 0) => {
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
            events: structuredClone(state.data.events),
          },
          false
        ),
        numberOfConnectedActions,
        description: 'deleteState',
      };
    },

    changeStateName: (id: string, name: string, state: State) => {
      return {
        redo: stateMachine.changeStateName.bind(stateMachine, id, name, false),
        undo: stateMachine.changeStateName.bind(stateMachine, id, state.data.name, false),
        description: 'changeStateName',
      };
    },

    changeStateEvents: (state: State, args: ChangeStateEventsParams) => {
      return {
        redo: stateMachine.changeStateEvents.bind(stateMachine, args, false),
        undo: stateMachine.setStateEvents.bind(stateMachine, {
          id: state.id,
          events: state.data.events,
        }),
        description: 'changeStateEvents',
      };
    },

    linkState: (parentId: string, childId: string, numberOfConnectedActions = 0) => {
      return {
        redo: stateMachine.linkState.bind(stateMachine, parentId, childId, false),
        undo: stateMachine.unlinkState.bind(stateMachine, childId, false),
        description: 'linkState',
        numberOfConnectedActions,
      };
    },

    unlinkState: (parentId: string, childId: string) => {
      return {
        redo: stateMachine.unlinkState.bind(stateMachine, childId, false),
        undo: stateMachine.linkState.bind(stateMachine, parentId, childId, false),
        description: 'unlinkState',
      };
    },

    createTransition: (id: string, params: CreateTransitionParameters) => {
      return {
        redo: stateMachine.createTransition.bind(stateMachine, { ...params, id }, false),
        undo: stateMachine.deleteTransition.bind(stateMachine, id, false),
        description: 'createTransition',
      };
    },

    deleteTransition: (transition: Transition) => {
      const prevData = structuredClone(transition.data);
      const id = transition.id;

      return {
        redo: stateMachine.deleteTransition.bind(stateMachine, transition.id, false),
        undo: stateMachine.createTransition.bind(
          stateMachine,
          {
            id,
            ...prevData,
            component: prevData.trigger.component,
            method: prevData.trigger.method,
            condition: prevData.condition!,
            doAction: prevData.do!,
          },
          false
        ),
        description: 'deleteTransition',
      };
    },

    changeTransition: (transition: Transition, args: ChangeTransitionParameters) => {
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
        description: 'changeTransition',
      };
    },

    changeInitialState: (id: string, prevInitial: string) => {
      return {
        redo: stateMachine.changeInitialState.bind(stateMachine, id, false),
        undo: stateMachine.changeInitialState.bind(stateMachine, prevInitial, false),
        description: 'changeInitialState',
      };
    },

    changeStatePosition: (id: string, startPosition: Point, endPosition: Point) => {
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
        description: `changeStatePosition from {x: ${startPosition.x}, y: ${startPosition.y}} to {x: ${endPosition.x}, y: ${endPosition.y}}`,
      };
    },

    changeTransitionPosition: (id: string, startPosition: Point, endPosition: Point) => {
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
        description: 'changeTransitionPosition',
      };
    },

    changeEvent: (stateId: string, event: any, newValue: Event | EventAction) => {
      return {
        redo: stateMachine.createOrChangeEvent.bind(stateMachine, stateId, event, newValue, false),
        undo: stateMachine.createOrChangeEvent.bind(stateMachine, stateId, newValue, event, false),
        description: 'changeEvent',
      };
    },

    addComponent: (args: AddComponentParams) => {
      return {
        redo: stateMachine.addComponent.bind(stateMachine, args, false),
        undo: stateMachine.removeComponent.bind(
          stateMachine,
          { name: args.name, purge: false },
          false
        ),
        description: 'addComponent',
      };
    },

    removeComponent: (args: RemoveComponentParams, prevComponent: Component) => {
      return {
        redo: stateMachine.removeComponent.bind(stateMachine, args, false),
        undo: stateMachine.addComponent.bind(
          stateMachine,
          { name: args.name, ...prevComponent },
          false
        ),
        description: 'removeComponent',
      };
    },

    editComponent: (args: EditComponentParams, prevComponent: Component) => {
      return {
        redo: stateMachine.editComponent.bind(stateMachine, args, false),
        undo: stateMachine.editComponent.bind(
          stateMachine,
          {
            name: args.newName ?? args.name,
            parameters: prevComponent.parameters,
            newName: args.newName ? args.name : undefined,
          },
          false
        ),
        description: 'editComponent',
      };
    },
  };
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

    const action = this.redoStack.pop() as Action;

    action.redo();

    if (action.numberOfConnectedActions) {
      for (let i = 0; i < action.numberOfConnectedActions; i++) {
        this.redo();
      }
    }

    // Если соединённые действия то первое должно попасть в конец undo стека
    this.undoStack.push(action);
  };

  isUndoStackEmpty() {
    return this.undoStack.length === 0;
  }

  isRedoStackEmpty() {
    return this.redoStack.length === 0;
  }
}
