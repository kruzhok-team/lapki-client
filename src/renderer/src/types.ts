export type Event = {
  component: string;
  method: string;
  args?: string[];
};

export type Condition = {
  component: string;
  method: string;
};

export type State = {
  height: number;
  width: number;
  x: number;
  y: number;
  events: { [id: string]: Event };
};

export type Transition = {
  source: string;
  target: string;
  condition: Condition;
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
