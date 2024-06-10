import { customAlphabet } from 'nanoid';

export const generateId = (existingIds: string[] = []) => {
  const nanoid = customAlphabet('abcdefghijklmnopqstuvwxyz', 20);

  let id = nanoid();
  while (existingIds.includes(id)) {
    id = nanoid();
  }

  return id;
};
