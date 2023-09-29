import { emptyElements, Action, Condition, EventData } from '@renderer/types/diagram';
import { Point } from '@renderer/types/graphics';

export const emptyEditorData = () => ({
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

export interface CreateStateParameters {
  name: string;
  position: Point;
  parentId?: string;
  id?: string;
  events?: EventData[];
}

export interface CreateTransitionParameters {
  id?: string;
  source: string;
  target: string;
  color: string;
  position: Point;
  component: string;
  method: string;
  doAction: Action[];
  condition: Condition | undefined;
}

export interface ChangeTransitionParameters {
  id: string;
  color: string;
  component: string;
  method: string;
  doAction: Action[];
  condition: Condition | undefined;
}

export interface ChangeStateEventsParams {
  id: string;
  events: Action[];
  triggerComponent: string;
  triggerMethod: string;
}

export interface SetStateEventsParams {
  id: string;
  events: EventData[];
}

export interface AddComponentParams {
  name: string;
  type: string;
  parameters?: { [key: string]: string };
}
