export type ArgType = string | string[];

export type ArgumentProto = {
  name: string;
  img?: string;
  description?: string;
  type?: ArgType;
};

export type ParameterProto = {
  name?: string;
  img?: string;
  description?: string;
  type?: ArgType;
};

export type SignalProto = {
  img?: string;
  description?: string;
  parameters?: ArgumentProto[];
};

export type VariableProto = {
  img?: string;
  type?: ArgType;
  description?: string;
  // TODO: parameters?: ArgumentProto[];
};

export type MethodProto = {
  img?: string;
  description?: string;
  parameters?: ArgumentProto[];
};

export type ComponentProto = {
  name?: string;
  description?: string;
  singletone?: boolean;
  img?: string;
  signals: { [name: string]: SignalProto };
  variables: { [name: string]: VariableProto };
  methods: { [name: string]: MethodProto };
  parameters: { [name: string]: ParameterProto };
};

export type Platform = {
  name?: string;
  description?: string;
  version: string;
  standardVersion: string;
  visual: boolean;
  delimeter: string;
  staticActionDelimeter: string;
  hidden?: boolean;
  components: { [name: string]: ComponentProto };
  parameters?: { [name: string]: ParameterProto };
};

export type PlatformInfo = {
  idx: string;
  name: string;
  description: string;
  hidden: boolean;
};

export type Platforms = {
  platform: { [id: string]: Platform };
};
