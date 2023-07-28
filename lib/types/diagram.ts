import { Point, Rectangle } from './graphics';

export type Event = {
  [id: string]: {
    component: string;
    method: string;
  };
};

export type Condition = {
  component: string;
  method: string;
  position: Point;
};

export type State = {
  parent?: string;
  name: string;
  bounds: Rectangle;
  events: Event;
};

export type Transition = {
  //id: string;
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
