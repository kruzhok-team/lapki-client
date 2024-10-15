import { State, InitialState, FinalState, ChoiceState } from '@renderer/lib/drawable';
import {
  Component as ComponentData,
  State as StateData,
  ChoiceState as ChoiseData,
  Transition as TransitionData,
  Note as NoteData,
  InitialState as InitialStateData,
  StateMachine,
} from '@renderer/types/diagram';

import { Point } from './graphics';

import { DrawableComponent } from '../drawable/ComponentNode';

export interface SelectDrawable {
  id: string;
  smId?: string;
}

export const emptyControllerData = () => ({
  stateMachinesSub: {},
});

export type ControllerDataPropertyName = 'stateMachinesSub' | 'visual';

export type ControllerDataListeners = { [key in ControllerDataPropertyName]: (() => void)[] };

export const emptyControllerListeners = Object.fromEntries([
  ...Object.entries(emptyControllerData()).map(([k]) => [k, []]),
]) as any as ControllerDataListeners;

export interface EditComponentParams {
  smId: string;
  id: string;
  type: string;
  parameters: ComponentData['parameters'];
  newName?: string;
}

export interface ChangeComponentPosition {
  id: string;
  startPosition: Point;
  endPosition: Point;
}

export interface ChangeSelectionParams {
  id: string;
  value: boolean;
}

export interface SetMountedStatusParams {
  canvasId: string;
  status: boolean;
}

export interface RenameComponentParams {
  smId: string;
  id: string;
  newName: string;
}

export interface DeleteStateMachineParams {
  id: string;
  stateMachine: StateMachine;
  purge?: boolean;
}

export interface LinkStateParams {
  parentId: string;
  childId: string;

  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  smId?: string;
  addOnceOff?: boolean;
  canBeInitial?: boolean;
}

export interface UnlinkStateParams {
  id: string;
  smId: string;
  canUndo?: boolean;
}

export interface ChangeStateNameParams {
  smId: string;
  id: string;
  name: string;
}

export type CCreateInitialStateParams = {
  id?: string;
  smId: string;
  targetId: string;
};

export type CreateInitialStateControllerParams = CCreateInitialStateParams & InitialStateData;

export interface AddDragendStateSig {
  smId: string;
  stateId: string;
}

export interface DeleteInitialStateParams {
  smId: string;
  id: string;
  targetId?: string;
}

export const getStatesControllerDefaultData = () => {
  return {
    states: new Map<string, State>(),
    initialStates: new Map<string, InitialState>(),
    finalStates: new Map<string, FinalState>(),
    choiceStates: new Map<string, ChoiceState>(),
  } as const;
};

export type StatesControllerData = ReturnType<typeof getStatesControllerDefaultData>;

export type StatesControllerDataStateType = keyof StatesControllerData;
export type StateVariant = StatesControllerData[StatesControllerDataStateType] extends Map<
  unknown,
  infer T
>
  ? T
  : never;
export type StateType = StatesControllerDataStateType extends `${infer T}s` ? T : never;

export const getComponentsControllerDefaultData = () => {
  return {
    components: new Map<string, DrawableComponent>(),
  } as const;
};

export type ComponentsControllerData = ReturnType<typeof getComponentsControllerDefaultData>;

export type ComponentsControllerDataComponentType = keyof ComponentsControllerData;
export type ComponentVariant =
  ComponentsControllerData[ComponentsControllerDataComponentType] extends Map<unknown, infer T>
    ? T
    : never;
export type ComponentType = ComponentsControllerDataComponentType extends `${infer T}s` ? T : never;

export type CopyData = { smId: string } & (
  | { type: 'state'; data: StateData & { id: string } }
  | { type: 'choiceState'; data: ChoiseData & { id: string } }
  | { type: 'transition'; data: TransitionData & { id: string } }
  | { type: 'note'; data: NoteData & { id: string } }
  | { type: 'component'; data: ComponentData & { id: string } }
);
export type CopyType = CopyData['type'];

export type LinkTransitionParams = {
  smId: string;
  stateId: string;
};
