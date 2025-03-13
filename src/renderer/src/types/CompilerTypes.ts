import { Point } from '@renderer/lib/types';

import { Action, ArgList, Condition, Event, Variable } from './diagram';

export type CompilerElements = {
  transitions: CompilerTransition[];
  initialState: CompilerInitialState;
  components: { [id: string]: CompilerComponent };
  platform: string;
  states: { [id: string]: CompilerState };
  parameters: { [key: string]: string };
};

export type CompilerState = {
  name: string;
  bounds: CompilerBounds;
  events: CompilerEvent[];
  parent?: string;
};

export type CompilerBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CompilerEvent = {
  trigger: CompilerAction;
  do: CompilerAction[];
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

type CompileStatus = 'OK' | 'NOTOK';

export type CompileStateMachineResult = {
  result: CompileStatus;
  name: string;
  commands: CompileCommandResult[];
  binary: Binary[];
  source: SourceFile[];
};

// То, чем мы пользуемся в IDE
export type CompilerResult = {
  result: string;
  state_machines: { [id: string]: CompileStateMachineResult };
};

type EncodedBinary = Binary & {
  filecontent: string;
};

// То, что приходит с компилятора
export type CompilerRequestStateMachine = CompileStateMachineResult & {
  binary: EncodedBinary[];
};

export type CompilerRequest = CompilerResult & {
  state_machines: { [id: string]: CompilerRequestStateMachine };
};

export type CompilerAction = {
  component: string;
  method: string;
  args?: { [id: string]: Variable | string };
};

export type CompilerTransition = {
  source: string;
  target: string;
  condition: Condition | null;
  trigger: CompilerAction;
  do: CompilerAction[];
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
