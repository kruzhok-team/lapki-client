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
} from '@renderer/types/diagram';

export const emptyEditorData = () => ({
  canvas: {} as { [id: string]: EditorStatus },
  basename: null as string | null,
  name: null as string | null,

  elements: emptyElements(),

  offset: { x: 0, y: 0 },
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
  | `elements.${keyof EditorData['elements']}.${keyof StateMachine}`
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

export type CreateStateParams = Omit<StateData, 'dimensions' | 'events'> & {
  smId: string;
  id?: string;
  events?: EventData[];

  placeInCenter?: boolean;

  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  linkByPoint?: boolean;
  canBeInitial?: boolean;
};

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

export interface CreateNoteParams {
  smId: string;
  id?: string;
  position: Point;
  text: string;
  placeInCenter?: boolean;
}

export interface ChangeStateEventsParams {
  smId: string;
  id: string;
  eventData: StateData['events'][number];
  color?: string;
}

export type CreateStateMachineParams = {
  id: string;
  components: ComponentData[];
  position: Point;
  label?: string;
};

export type ChangeStateMachineParams = CreateStateMachineParams;

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
  name1: string;
  name2: string;
}
