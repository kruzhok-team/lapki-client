import { Point, Rectangle } from './graphics';

export type Event = {
  component: string;
  method: string;
  args?: string[];
};

export type Condition = {
  component: string;
  method: string;
  position: Point;
};

export type State = {
  parent?: string;
  bounds: Rectangle;
  events: { [id: string]: Event };
};

export type Transition = {
  // id: string;
  source: string;
  target: string;
  condition: Condition;
  color: string;
};

export type Component = {
  type: string;
  parameters: { [key: string]: any };
};

export type Elements = {
  states: { [id: string]: State };
  transitions: { [id: string]: Transition };
  components: { [id: string]: Component };

  initialState: string;
};
