import { readdir, readFile } from 'fs/promises';
import path from 'path';

const basePath = path.join(__dirname, '../../resources').replace('app.asar', 'app.asar.unpacked');
const templatesPath = basePath + '/templates';

const removeExtension = (filename: string) => {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
};

/**
 * Функция возвращает только названия примеров
 */
export const getAllTemplates = async () => {
  try {
    const dirs = (await readdir(templatesPath, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .map((dir) => dir.name);
    const result = {};

    for (const dirName of dirs) {
      result[dirName] = (await readdir(path.join(templatesPath, dirName))).map(removeExtension);
    }

    return result;
  } catch (error) {
    return [];
  }
};

/**
 * Возвращает схему примера по типу (название папки) и имени
 */
export const getTemplate = async (type: string, name: string) => {
  const data = await readFile(path.join(templatesPath, type + '/' + name), 'utf-8');
  return data;
};
