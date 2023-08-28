import { Point, Rectangle } from './graphics';

export type Action = {
  component: string;
  method: string;
  // FIXME: в перспективе тип должен быть string | Variable
  args?: { [key: string]: string };
};

export type CompilerSettings = {
  filename: string;
  compiler: string;
  flags: Array<string>;
};

export type Event = {
  component: string;
  method: string;
  // FIXME: в перспективе тип должен быть string | Variable
  args?: { [key: string]: string };
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
};

export type Component = {
  type: string;
  parameters: { [key: string]: string };
};

export type Elements = {
  states: { [id: string]: State };
  transitions: Transition[];
  components: { [id: string]: Component };

  initialState: string;

  platform: string;
  parameters?: { [key: string]: string };
  compilerSettings?: CompilerSettings | null;
};

export function emptyElements(): Elements {
  return {
    states: {},
    transitions: [],
    components: {},
    initialState: '',

    platform: '',
    parameters: {},
    compilerSettings: null,
  };
}
