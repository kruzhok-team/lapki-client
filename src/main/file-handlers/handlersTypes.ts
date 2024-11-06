// TODO(bryzZz) Убрать Either тип а с ним уйдут и эти
export type HandleFileOpenReturn = Promise<[boolean, string | null, string | null, string]>;
export type HandleOpenPlatformFileReturn = Promise<
  [boolean, string | null, string | null, string | null]
>;
export type HandleGetPlatformsReturn = Promise<[boolean, string[] | string]>;
export type SearchPlatformsReturn = Promise<[boolean, string[]]>;
export type HandleSaveIntoFolderReturn = Promise<[boolean, string | null, string]>;
export type HandleFileSaveReturn = Promise<[boolean, string, string]>;
export type HandleFileSaveAsReturn = Promise<[boolean, string | null, string | null]>;
export type HandleScreenShotSaveAsReturn = Promise<[boolean, string | null, string | null]>;
export type HandleBinFileOpenReturn = Promise<
  [boolean, string | null, string | null, string | Buffer]
>;
