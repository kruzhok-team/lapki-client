import { Point } from '@renderer/lib/types/graphics';
import {
  emptyElements,
  EventData,
  State as StateData,
  Transition as TransitionData,
  InitialState as InitialStateData,
  FinalState as FinalStateData,
  ChoiceState as ChoiceStateData,
  Component as ComponentData,
  StateMachine,
  Action,
  Event,
} from '@renderer/types/diagram';

import { EventSelection } from '../drawable';

export const emptyEditorData = () => ({
  canvas: {} as { [id: string]: EditorStatus },
  basename: null as string | null,
  name: null as string | null,

  elements: emptyElements(),
  offset: { x: 0, y: 0 },
  headControllerId: '',
  scale: 1,
  isStale: false,
});

export function emptyEditorStatus(): EditorStatus {
  return {
    prevMounted: false,
    isMounted: false,
    isInitialized: false,
  };
}

export type EditorStatus = {
  prevMounted: boolean;
  isMounted: boolean;
  isInitialized: boolean;
};

export type EditorData = ReturnType<typeof emptyEditorData>;
export type EditorDataPropertyName =
  | keyof EditorData
  | 'elements.stateMachinesId'
  | `elements.${keyof StateMachine}`
  | `canvas.${keyof EditorStatus}`;
export type EditorDataReturn<T> = T extends `elements.${infer V}`
  ? V extends keyof EditorData['elements']
    ? EditorData['elements'][V]
    : never
  : T extends keyof EditorData
  ? EditorData[T]
  : never;
export type EditorDataListeners = { [key in EditorDataPropertyName]: (() => void)[] };

export const emptyDataListeners = Object.fromEntries([
  ...Object.entries(emptyEditorData()).map(([k]) => [k, []]),
  ...Object.entries(emptyEditorData().elements).map(([k]) => [`elements.${k}`, []]),
]) as any as EditorDataListeners;

export type CreateStateParams = StateData & {
  smId: string;
  id?: string;
  events?: EventData[];

  placeInCenter?: boolean;

  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  linkByPoint?: boolean;
  canBeInitial?: boolean;
};
export type ChangeStateParams = Pick<StateData, 'events' | 'color'> & { smId: string; id: string };

export type CreateInitialStateParams = InitialStateData & { smId: string; id?: string };
export type CreateFinalStateParams = FinalStateData & {
  id?: string;
  placeInCenter?: boolean;
  smId: string;
  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  linkByPoint?: boolean;
};

export type CreateChoiceStateParams = ChoiceStateData & {
  id?: string;
  smId: string;
  placeInCenter?: boolean;

  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  linkByPoint?: boolean;
};

export type CreateTransitionParams = TransitionData & { smId: string; id?: string };
export type ChangeTransitionParams = TransitionData & { smId: string; id: string };
export type ChangeComponent = ComponentData & { smId: string; id: string };

export interface CreateNoteParams {
  smId: string;
  id?: string;
  position: Point;
  text: string;
  placeInCenter?: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export interface ChangeNoteFontSizeParams {
  smId: string;
  id: string;
  fontSize?: number;
}

export interface ChangeNoteTextColorParams {
  smId: string;
  id: string;
  textColor?: string;
}

export interface ChangeNoteBackgroundColorParams {
  smId: string;
  id: string;
  backgroundColor?: string;
}

export interface ChangeNoteText {
  smId: string;
  id: string;
  text: string;
}

export type CreateStateMachineParams = {
  smId: string;
  platform: string;
  position: Point;
  name?: string;
  label?: string;
};

export type ChangeStateMachineParams = CreateStateMachineParams;

export type ChangePosition = {
  smId: string;
  id: string;
  startPosition?: Point;
  endPosition: Point;
};

export type ChangeEventParams = {
  smId: string;
  stateId: string;
  event: EventSelection;
  newValue: Event | Action;
  canUndo?: boolean;
};

export type deleteStateMachineParams = {
  smId: string;
};

export type DeleteEventParams = {
  smId: string;
  stateId: string;
  event: EventSelection;
};

export type CreateEventActionParams = {
  smId: string;
  stateId: string;
  event: EventSelection;
  value: Action;
};

export type CreateEventParams = {
  smId: string;
  stateId: string;
  eventData: EventData;
  eventIdx?: number;
};

export type CreateComponentParams = ComponentData & {
  name: string;
  smId: string;
  placeInCenter?: boolean;
};

export type DeleteDrawableParams = {
  smId: string;
  id: string;
};

export interface SwapComponentsParams {
  smId: string;
  name1: string;
  name2: string;
}
