import { Dimensions, Point } from '@renderer/lib/types';

// FIXME: в перспективе тип должен быть string | Variable
export type ArgList = { [key: string]: string };

export type Action = {
  component: string;
  method: string;
  args?: ArgList;
};

export type Meta = { [id: string]: string };

export type CompilerSettings = {
  filename: string;
  compiler: string;
  flags: Array<string>;
};

export type Event = {
  component: string;
  method: string;
  args?: ArgList;
};

export type EventData = {
  trigger: Event;
  do: Action[];
  // TODO: condition?: Condition;
};

interface BaseState {
  parentId?: string;
  position: Point;
}

export interface NormalState extends BaseState {
  name: string;
  events: EventData[];
  dimensions: Dimensions;
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InitialState extends BaseState {}

export type State = NormalState | InitialState;

export const isNormalState = (state: State): state is NormalState => 'name' in state;

export type Variable = {
  component: string;
  method: string;
  args?: { [key: string]: string };
};

export type Condition = {
  type: string;
  value: Condition[] | Variable | number | string;
};

export interface Transition {
  source: string;
  target: string;
  color: string;
  label?: {
    position: Point;
    trigger?: Event;
    condition?: Condition | null;
    do?: Action[];
    //TODO: В дальнейшем планируется убрать
    selection?: boolean;
  };
}

export type Component = {
  transitionId: string;
  type: string;
  parameters: { [key: string]: string };
};

export type Note = {
  position: Point;
  text: string;
};

// Это описание типа схемы которая хранится в json файле
export type Elements = {
  states: { [id: string]: State };
  transitions: { [id: string]: Transition };
  components: { [id: string]: Component };
  notes: { [id: string]: Note };

  // initialState: InitialState | null;

  platform: string;
  parameters?: { [key: string]: string };
  compilerSettings?: CompilerSettings | null;
  meta: Meta;
};

export function emptyElements(): Elements {
  return {
    states: {},
    // initialStates: {},
    transitions: {},
    components: {},
    notes: {},
    // initialState: null,

    platform: '',
    parameters: {},
    compilerSettings: null,
    meta: {},
  };
}
