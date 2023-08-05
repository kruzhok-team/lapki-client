import { Point, Rectangle } from './graphics';

export type Action = {
  component: string;
  method: string;
  args?: any[];
};

export type Event = {
  component: string;
  method: string;
  args?: any[];
};

export type Variable = {
  component: string;
  method: string;
  args?: any[];
};

export type ActingEvent = Event & {
  actions: Action[];
};

export type EventData = {
  trigger: Event;
  do: Action[];
};

export type State = {
  parent?: string;
  name: string;
  bounds: Rectangle;
  events: EventData[];
};

export type Condition = {
  type: string;
  value: Variable | Condition[] | Condition | number | string;
};

export type Transition = {
  //id: string;
  source: string;
  target: string;
  color: string;
  position: Point;
  trigger: Event;
  conditions?: Condition;
  do?: Action[];
};

export type Component = {
  type: string;
  parameters: { [key: string]: any };
};

export type Elements = {
  states: { [id: string]: State };
  transitions: Transition[];
  components: { [id: string]: Component };

  initialState: string;

  platform: string;
  parameters?: { [key: string]: string };
};

export function emptyElements(): Elements {
  return {
    states: {},
    transitions: [],
    components: {},
    initialState: '',

    platform: '',
    parameters: {},
  };
}
