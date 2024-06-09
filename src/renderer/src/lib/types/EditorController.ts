import { State, InitialState, FinalState, ChoiceState } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { Component, Transition as TransitionData } from '@renderer/types/diagram';

export interface EditComponentParams {
  name: string;
  parameters: Component['parameters'];
  newName?: string;
}

export interface RemoveComponentParams {
  name: string;
  purge?: boolean;
}

export interface LinkStateParams {
  parentId: string;
  childId: string;

  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  addOnceOff?: boolean;
  canBeInitial?: boolean;
}

export interface UnlinkStateParams {
  id: string;
}

export interface CCreateInitialStateParams {
  id?: string;
  targetId: string;
}

export interface DeleteInitialStateParams {
  id: string;
  targetId: string;
}

export type CreateTransitionParams = Omit<TransitionData, 'selection' | 'label'> & {
  label?: Omit<Required<TransitionData>['label'], 'position'> & { position?: Point };
} & { id?: string };

export type ChangeTransitionParams = Omit<TransitionData, 'selection' | 'label'> & {
  label?: Omit<Required<TransitionData>['label'], 'position'> & { position?: Point };
} & { id: string };

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
