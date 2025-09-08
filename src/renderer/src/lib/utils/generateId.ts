import { customAlphabet } from 'nanoid';

import { Platform } from '@renderer/types/platform';

export const generateId = (existingIds: string[] = []) => {
  const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);

  let id = nanoid();
  while (existingIds.includes(id)) {
    id = nanoid();
  }

  return id;
};

export const generateSmId = (isDuplicateId: (name: string) => boolean, platform: Platform) => {
  return generateUniqueName(isDuplicateId, platform.nameTag ?? 'Machine');
};

export const generateUniqueName = (isDuplicateId: (name: string) => boolean, baseKey: string) => {
  let n = 1;
  let uniqueName = baseKey + n;
  while (isDuplicateId(uniqueName)) {
    n += 1;
    uniqueName = baseKey + n;
  }
  return uniqueName;
};
