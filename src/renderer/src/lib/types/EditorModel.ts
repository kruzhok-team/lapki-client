import { Point } from '@renderer/lib/types/graphics';
import {
  emptyElements,
  Action,
  EventData,
  Transition as TransitionData,
  InitialState as InitialStateData,
  FinalState as FinalStateData,
} from '@renderer/types/diagram';

export const emptyEditorData = () => ({
  isMounted: false,
  isInitialized: false,
  isStale: false,
  basename: null as string | null,
  name: null as string | null,

  elements: emptyElements(),

  offset: { x: 0, y: 0 },
  scale: 1,
});

export type EditorData = ReturnType<typeof emptyEditorData>;
export type EditorDataPropertyName = keyof EditorData | `elements.${keyof EditorData['elements']}`;
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

export interface CreateStateParams {
  name: string;
  position: Point;
  color: string;
  parentId?: string;
  id?: string;
  events?: EventData[];
  placeInCenter?: boolean;
  linkByPoint?: boolean;
  canBeInitial?: boolean;
}

export type CreateInitialStateParams = InitialStateData & { id?: string };
export type CreateFinalStateParams = FinalStateData & {
  id?: string;
  placeInCenter?: boolean;
  linkByPoint?: boolean;
};
export type CreateTransitionParams = TransitionData & { id?: string };
export type ChangeTransitionParams = TransitionData & { id: string };

export interface CreateNoteParams {
  id?: string;
  position: Point;
  text: string;
  placeInCenter?: boolean;
}

export interface ChangeStateEventsParams {
  id: string;
  actions: Action[];
  triggerComponent: string;
  triggerMethod: string;
  color: string;
}

export interface AddComponentParams {
  name: string;
  type: string;
  parameters?: { [key: string]: string };
}
