import { Point } from '@renderer/lib/types';

import { Action, ArgList, Condition, Event } from './diagram';

export type CompilerElements = {
  transitions: { [id: string]: CompilerTransition };
  initialState: CompilerInitialState;
  components: { [id: string]: CompilerComponent };
  platform: string;
  states: { [id: string]: CompilerState };
  parameters: { [key: string]: string };
};

export type CompilerState = {
  name: string;
  bounds: CompilerBounds;
  events: CompilerAction[];
  parent?: string;
};

export type CompilerBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CompilerAction = {
  trigger: Event;
  do: Event[];
};

export type CompilerComponent = {
  type: string;
  position: Point;
  parameters: { [key: string]: string };
};

export type CompileCommandResult = {
  command: string;
  return_code: string;
  stdout: string;
  stderr: string;
};

export type CompilerResult = {
  result: string;
  commands: CompileCommandResult[];
  binary?: Array<Binary>;
  source?: Array<SourceFile>;
  // платформа для которой была осуществлена компиляция
  platform?: string;
};

export type CompilerEvent = {
  component: string;
  method: string;
  args?: ArgList;
};

export type CompilerTransition = {
  source: string;
  target: string;
  condition: Condition | null;
  trigger: CompilerEvent;
  do: Action[];
  color: string;
  position: Point;
};

export type CompilerInitialState = {
  target: string;
  position: Point;
};

export type SourceFile = {
  filename: string;
  extension: string;
  fileContent: string;
};

export type Binary = {
  filename: string;
  extension: string;
  fileContent: Blob | Buffer;
};

export type CompilerSettings = {
  filename: string;
  compiler: string;
  flags: Array<string>;
};
