export type CompilerResult = {
  result: string;
  stdout?: string;
  stderr?: string;
  binary?: Array<Binary>;
  source?: Array<SourceFile>;
  // платформа для которой была осуществлена компиляция
  platform?: string;
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
