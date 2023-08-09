//Необработанный ответ
export type CompilerResponse = {
  result: string,
  stdout: string,
  stderr: string,
  binary: Array<Map<string, string>>,
  source: Array<Map<string, string>>
}

//Обработанный ответ, с которым можно работать
export type CompilerResult = {
  result: string,
  stdout: string,
  stderr: string,
  binary: Array<Binary> | undefined,
  source: Array<SourceFile> | undefined
}


export type SourceFile = {
  filename: string,
  fileContent: string;
}

export type Binary = {
  filename: string,
  binary: Blob
}

export type CompilerSettings = {
  filename: string,
  compiler: string,
  flags: Array<string>,
}