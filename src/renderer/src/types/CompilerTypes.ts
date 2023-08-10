export type CompilerResult = {
  result: string,
  stdout: string,
  stderr: string,
  binary: Array<Binary>
  source: Array<SourceFile>
}


export type SourceFile = {
  filename: string,
  extension: string,
  fileContent: string;
}

export type Binary = {
  filename: string,
  fileContent: Blob
}

export type CompilerSettings = {
  filename: string,
  compiler: string,
  flags: Array<string>,
}