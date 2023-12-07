import { readdir, readFile } from 'fs/promises';
import path from 'path';

const basePath = path.join(__dirname, '../../resources').replace('app.asar', 'app.asar.unpacked');
const templatesPath = basePath + '/templates';

export const getAllTemplates = async () => {
  try {
    const dirs = (await readdir(templatesPath, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .map((dir) => dir.name);
    const result = {};

    for (const dirName of dirs) {
      const files = await readdir(path.join(templatesPath, dirName));
      result[dirName] = [];

      for (const fileName of files) {
        const data = await readFile(path.join(templatesPath, dirName + '/' + fileName), 'utf-8');
        result[dirName].push({
          name: fileName,
          data,
        });
      }
    }

    return result;
  } catch (error) {
    return [];
  }
};
