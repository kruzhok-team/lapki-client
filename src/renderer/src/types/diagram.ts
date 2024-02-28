import { Point, Rectangle } from './graphics';

// FIXME: в перспективе тип должен быть string | Variable
export type ArgList = { [key: string]: string };

export type Action = {
  component: string;
  method: string;
  args?: ArgList;
};

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

export type State = {
  parent?: string;
  name: string;
  bounds: Rectangle;
  events: EventData[];
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
};

export type InitialState = {
  target: string;
  position: Point;
};

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

export type Component = {
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
  transitions: Transition[];
  components: { [id: string]: Component };
  notes: Note[];

  initialState: InitialState | null;

  platform: string;
  parameters?: { [key: string]: string };
  compilerSettings?: CompilerSettings | null;
  meta: { [id: string]: string };
};

// Данные внутри редактора хранятся немного по-другому и это их описание
export interface InnerElements extends Omit<Elements, 'transitions' | 'notes'> {
  transitions: Record<string, Transition>;
  notes: Record<string, Note>;
}

export function emptyElements(): InnerElements {
  return {
    states: {},
    transitions: {},
    components: {},
    notes: {},
    initialState: null,

    platform: '',
    parameters: {},
    compilerSettings: null,
    meta: {},
  };
}
