import { dialog } from 'electron';
import { readdir, readFile } from 'fs/promises';
import fs from 'fs';
import { basename } from 'path';
import { Binary, SourceFile } from '../renderer/src/types/CompilerTypes';

/**
 * Асинхронный диалог открытия файла схемы.
 * @returns Promise
 */

export async function handleFileOpen(platform: string) {
  return new Promise(async (resolve, _reject) => {
    const platforms: Map<string, Array<string>> = new Map([
      ['ide', ['json']],
      ['BearlogaDefend', ['graphml']],
    ]);
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'json', extensions: platforms.get(platform)! }],
      properties: ['openFile'],
    });
    const fileName = filePaths[0];
    if (!canceled && fileName) {
      fs.readFile(fileName, 'utf-8', (err, data) => {
        if (err) {
          resolve([false, fileName, basename(fileName), err.message]);
        } else {
          resolve([true, fileName, basename(fileName), data]);
        }
      });
    } else {
      resolve([false, null, null, '']);
    }
  });
}

export async function handleOpenPlatformFile(absolute_path: string) {
  return new Promise(async (resolve, _reject) => {
    await readFile(absolute_path, 'utf-8')
      .then((text) => {
        resolve([true, text, basename(absolute_path), null]);
      })
      .catch((err) => {
        console.log(err);
        resolve([false, null, null, err.message]);
      });
  });
}

/**
 * @param directory - путь до папки, содержащей схемы платформ
 * @returns список абсолютных путей до схем платформ
 */
export async function handleGetPlatforms(directory: string): Promise<Array<any>> {
  return new Promise(async (resolve, _reject) => {
    if (fs.existsSync(directory)) {
      await readdir(directory)
        .then((files) => {
          const platformPaths = new Array<string>();
          files.forEach((element) => {
            if (directory.endsWith('/')) {
              platformPaths.push(`${directory}${element}`);
            } else {
              platformPaths.push(`${directory}/${element}`);
            }
          });
          resolve([true, platformPaths]);
        })
        .catch((err) => {
          console.log(err);
          resolve([false, err.message]);
        });
    } else {
      resolve([false, `${directory} doesn't exists!`]);
      console.log(`${directory} doesn't exists!`);
    }
  });
}

export async function handleSaveIntoFolder(data: Array<SourceFile | Binary>) {
  return new Promise(async (resolve, _reject) => {
    await dialog
      .showOpenDialog({
        properties: ['openDirectory'],
      })
      .then((file) => {
        const directory = file.filePaths[0];
        if (!file.canceled && directory) {
          data.map((element) => {
            const path = directory.concat('/', element.filename, '.', element.extension);
            fs.writeFile(path, element.fileContent as Buffer | string, function (err) {
              if (err) {
                resolve([false, directory, err.message]);
              } else {
                console.log('Сохранено!');
                resolve([true, directory, basename(directory)]);
              }
            });
          });
        }
      })
      .catch((err) => {
        console.log(err);
        resolve([false, null, err.message]);
      });
  });
}

/**
 * Асинхронное сохранение файла схемы.
 * @returns Promise
 */
export async function handleFileSave(fileName, data) {
  return new Promise(async (resolve, _reject) => {
    await fs.writeFile(fileName, data, function (err) {
      if (err) {
        resolve([false, fileName, err.message]);
      } else {
        console.log('Сохранено!');
        resolve([true, fileName, basename(fileName)]);
      }
    });
  });
}

/**
 * Асинхронный диалог сохранения файла схемы.
 * @returns Promise
 */
export async function handleFileSaveAs(filename, data) {
  return new Promise(async (resolve, _reject) => {
    await dialog
      .showSaveDialog({
        title: 'Выберите путь к файлу для сохранения',
        defaultPath: filename ? filename : __dirname, // path.join(__dirname, fileName),
        buttonLabel: 'Сохранить',
        filters: [{ name: 'json', extensions: ['json'] }],
      })
      .then((file) => {
        if (file.canceled) {
          resolve([false, null, null]);
        } else {
          // Создание и запись в файл
          if (typeof file.filePath === 'string') {
            fs.writeFile(file.filePath!, data, function (err) {
              if (err) {
                resolve([false, file.filePath!, err.message]);
                // throw err;
              } else {
                resolve([true, file.filePath!, basename(file.filePath!)]);
                console.log('Сохранено!');
              }
            });
          } else {
            resolve([false, null, null]);
          }
        }
      })
      .catch((err) => {
        console.log(err);
        resolve([false, null, err.message]);
      });
  });
}

/**
 * Асинхронный диалог открытия файла прошивки.
 * @returns Promise
 */
export async function handleBinFileOpen() {
  return new Promise(async (resolve, _reject) => {
    let validExtensions = ['hex', 'bin'];
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'binary files', extensions: validExtensions }],
      properties: ['openFile'],
    });
    const fileName = filePaths[0];
    if (!canceled && fileName) {
      fs.readFile(fileName, (err, data) => {
        if (err) {
          resolve([false, fileName, basename(fileName), err.message]);
        } else {
          resolve([true, fileName, basename(fileName), data]);
        }
      });
    } else {
      resolve([false, null, null, '']);
    }
  });
}
