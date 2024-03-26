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
