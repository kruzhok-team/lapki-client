export type ArgType = string | string[] | number[];

export type ArgumentProto = {
  name: string;
  img?: string;
  description?: string;
  type?: ArgType;
  optional?: boolean;
  valueAlias?: string[];
};

export type ParameterProto = {
  name?: string;
  img?: string;
  description?: string;
  type?: ArgType;
  optional?: boolean;
  valueAlias?: string[];
};

export type SignalProto = {
  img?: string;
  description?: string;
  parameters?: ArgumentProto[];
  checkMethod?: string;
  alias?: string;
};

export type VariableProto = {
  img?: string;
  type?: ArgType;
  description?: string;
  alias?: string;
  valueAlias?: string[];
  // TODO: parameters?: ArgumentProto[];
};

export type MethodProto = {
  img?: string;
  description?: string;
  parameters?: ArgumentProto[];
  alias?: string;
};

export type ComponentProto = {
  name?: string;
  description?: string;
  singletone?: boolean;
  img?: string;
  buildFiles?: string[];
  importFiles?: string[];
  signals: { [name: string]: SignalProto };
  variables: { [name: string]: VariableProto };
  methods: { [name: string]: MethodProto };
  constructorParameters?: { [name: string]: ParameterProto };
  initializationParameters?: { [name: string]: ParameterProto };
  initializationFunction?: string;
  loopActions?: string[];
};

export type CompilingSettings = {
  command: string;
  flags: string[];
};

export type Platform = {
  id: string;
  name?: string;
  nameTag?: string;
  description?: string;
  compile: boolean;
  author: string;
  icon: string;
  formatVersion: string;
  standardVersion: string;
  staticComponents: boolean;
  delimeter: string;
  language?: string;
  defaultIncludeFiles?: string[];
  defaultBuildFiles?: string[];
  compilingSettings?: CompilingSettings[];
  mainFunction?: boolean;
  mainFileExtension?: string;
  version: string;
  visual: boolean;
  staticActionDelimeter: string;
  headerFileExtension?: string;
  defaultSetupFunctions?: string[];
  componentDeclaration?: boolean;
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

// TODO(L140-beep): Раньше в одном файле находилось несколько платформ, а JSONCodec проверяет тип Platforms.
export type Platforms = Platform;
