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
  trigger: Event | string;
  do: Action[] | string;
  condition?: Condition | string;
};

interface BaseState {
  parentId?: string;
  dimensions: Dimensions;
  position: Point;
}

export interface State extends BaseState {
  name: string;
  events: EventData[];
  dimensions: Dimensions;
  color?: string;
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InitialState extends BaseState {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FinalState extends BaseState {}

export interface ChoiceState extends BaseState {
  selection?: boolean;
}

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
  sourceId: string;
  targetId: string;
  color?: string;
  label?: {
    position: Point;
    trigger?: Event | string;
    condition?: Condition | null | string;
    do?: Action[] | string;
  };
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
}

export type Note = {
  position: Point;
  text: string;
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
};

//Получаем тип со всеми машинами состояний
export type StateMachines = {
  stateMachines: { [id: string]: Machine };
};

//Добавляем id для машины состояний, а также прилегающие к ней элементы, плюс выделение
export type Machine = {
  elements: Elements;
  meta: Meta;
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
};

export type Component = {
  type: string;
  position: Point;
  parameters: { [key: string]: string };
  order: number;
  //TODO: В дальнейшем планируется убрать
  selection?: boolean;
};

export type StateMachine = {
  name?: string;
  position: Point;
  states: { [id: string]: State };
  initialStates: { [id: string]: InitialState };
  finalStates: { [id: string]: FinalState };
  choiceStates: { [id: string]: ChoiceState };
  transitions: { [id: string]: Transition };
  components: { [name: string]: Component };
  notes: { [id: string]: Note };

  platform: string;
  visual: boolean;
  parameters?: { [key: string]: string };
  compilerSettings?: CompilerSettings | null;
  meta: Meta;
};

// Это описание типа схемы которая хранится в json файле
export type Elements = {
  stateMachines: { [id: string]: StateMachine };
  parameters?: { [key: string]: string };
};

export function emptyStateMachine(): StateMachine {
  return {
    states: {},
    initialStates: {},
    finalStates: {},
    choiceStates: {},
    transitions: {},
    components: {},
    notes: {},
    platform: '',
    visual: true,
    parameters: {},
    compilerSettings: null,
    meta: {},
    position: { x: 0, y: 0 },
  };
}

export function emptyElements(): Elements {
  return {
    stateMachines: {},
    parameters: {},
  };
}
