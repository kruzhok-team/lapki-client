export type CompilerResult = {
  result: string,
  stdout: string,
  stderr: string,
  binary: Array<Map<[string], string>>,
  source: Array<Map<[string], string>>
}

export type CompilerSettings = {
  filename: string,
  compiler: string,
  flags: Array<string>,
}