import { Dimensions, Point } from './graphics';

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

export interface IBaseState {
  parentId?: string;
  position: Point;
  dimensions: Dimensions;
}

export interface INormalState extends IBaseState {
  name: string;
  events: EventData[];
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
}

export type IInitialStateNew = IBaseState;

export type IState = INormalState | IInitialStateNew;

// export type InitialState = {
//   target: string;
//   position: Point;
// };

export type Variable = {
  component: string;
  method: string;
  args?: { [key: string]: string };
};

export type Condition = {
  type: string;
  value: Condition[] | Variable | number | string;
};

export type Transition = {
  //id: string;
  source: string;
  target: string;
  color: string;
  position: Point;
  trigger: Event;
  condition?: Condition | null;
  do?: Action[];
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
};

// export type

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
  states: { [id: string]: IState };
  // initialStates: { [id: string]: InitialState };
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
