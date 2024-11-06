import { dialog, app } from 'electron';
import settings from 'electron-settings';

import fs from 'fs';
import { readdir, readFile } from 'fs/promises';
import path, { basename } from 'path';

import { Binary, SourceFile } from './CompilerTypes';
import {
  HandleFileOpenReturn,
  HandleOpenPlatformFileReturn,
  HandleGetPlatformsReturn,
  SearchPlatformsReturn,
  HandleSaveIntoFolderReturn,
  HandleFileSaveReturn,
  HandleFileSaveAsReturn,
  HandleScreenShotSaveAsReturn,
  HandleBinFileOpenReturn,
} from './handlersTypes';

/**
 * Асинхронный диалог открытия файла схемы.
 */
export async function handleFileOpen(platform: string, path?: string): HandleFileOpenReturn {
  return new Promise((resolve) => {
    const platforms: Map<string, Array<string>> = new Map([
      ['ide', ['json']],
      ['Cyberiada', ['graphml']],
    ]);

    let filePath = path;
    let canceled = false;

    const open = (filePath: string | undefined, canceled: boolean) => {
      if (!canceled && filePath) {
        fs.readFile(filePath, 'utf-8', (err, data) => {
          if (err) {
            resolve([false, filePath ?? null, basename(filePath as string), err.message]);
          } else {
            resolve([true, filePath ?? null, basename(filePath as string), data]);
          }
        });
      } else {
        resolve([false, null, null, '']);
      }
    };

    if (path) {
      return open(filePath, canceled);
    }

    return dialog
      .showOpenDialog({
        filters: [{ name: 'graphml', extensions: platforms.get(platform)! }],
        properties: ['openFile'],
      })
      .then((res) => {
        filePath = res.filePaths[0];
        canceled = res.canceled;
        return [filePath, canceled] as const;
      })
      .then(([filePath, canceled]) => open(filePath, canceled));
  });
}

export async function handleOpenPlatformFile(absolute_path: string): HandleOpenPlatformFileReturn {
  return new Promise((resolve) => {
    readFile(absolute_path, 'utf-8')
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
 */
export async function handleGetPlatforms(directory: string): HandleGetPlatformsReturn {
  return new Promise((resolve) => {
    if (fs.existsSync(directory)) {
      readdir(directory)
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

export async function searchPlatforms(): SearchPlatformsReturn {
  const basePath = path.join(__dirname, '../../resources').replace('app.asar', 'app.asar.unpacked');
  const DEFAULT_PATH = [basePath + '/platform', app.getPath('userData') + '/platform'];

  return new Promise(async (resolve) => {
    const platformsPaths = new Array<string>();
    const userPath = (await settings.get('platformsPath')) as string;
    let platformFound = false;
    if (userPath != '') {
      DEFAULT_PATH.push(userPath);
    }
    for (const path of DEFAULT_PATH) {
      const response = await handleGetPlatforms(path);
      if (response[0]) {
        if (response[1].length > 0) {
          platformsPaths.push(...response[1]);
          platformFound = true;
        }
      }
    }
    resolve([platformFound, platformsPaths]);
  });
}

export async function handleSaveIntoFolder(
  data: Array<SourceFile | Binary>
): HandleSaveIntoFolderReturn {
  return new Promise((resolve) => {
    dialog
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
 */
export async function handleFileSave(fileName: string, data: string): HandleFileSaveReturn {
  return new Promise((resolve) => {
    fs.writeFile(fileName, data, function (err) {
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
 */
export async function handleFileSaveAs(filename: string, data: string): HandleFileSaveAsReturn {
  return new Promise((resolve) => {
    dialog
      .showSaveDialog({
        title: 'Выберите путь к файлу для сохранения',
        defaultPath: filename ? filename : __dirname, // path.join(__dirname, fileName),
        buttonLabel: 'Сохранить',
        filters: [{ name: 'graphml', extensions: ['graphml'] }],
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
 * Асинхронный диалог сохранения скриншота.
 */
export async function handleScreenShotSaveAs(
  filename: string,
  dataUrl: string
): HandleScreenShotSaveAsReturn {
  return new Promise((resolve) => {
    dialog
      .showSaveDialog({
        title: 'Выберите путь к файлу для сохранения',
        defaultPath: filename ? filename : __dirname,
        buttonLabel: 'Сохранить',
        filters: [
          { name: 'png', extensions: ['png'] },
          // { name: 'jpeg', extensions: ['jpeg'] },
          // { name: 'svg', extensions: ['svg'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      .then(async (file) => {
        if (file.canceled) {
          resolve([false, null, null]);
        } else {
          // По умолчанию сохраняем в PNG
          let extension = 'png';
          if (file.filePath) {
            // Получаем расширение файла из пути
            const extensionMatch = file.filePath.match(/\.([^.]+)$/);
            if (extensionMatch) {
              extension = extensionMatch[1].toLowerCase();
            }
            //['png', 'jpeg', 'svg']
            if (!['png'].includes(extension)) {
              console.error('Неподдерживаемое расширение файла:', extension);
              resolve([false, null, 'Неподдерживаемое расширение файла']);
              return;
            }

            const base64Data = dataUrl.replace(new RegExp(`^data:image/${extension};base64,`), '');
            fs.writeFile(file.filePath, base64Data, 'base64', (err) => {
              if (err) {
                console.error('Ошибка сохранения скриншота:', err);
                resolve([false, file.filePath!, err.message]);
              } else {
                resolve([true, file.filePath!, basename(file.filePath!)]);
                console.log('Сохранено!');
                console.log(file.filePath);
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
 */
export async function handleBinFileOpen(): HandleBinFileOpenReturn {
  return new Promise(async (resolve) => {
    const validExtensions = ['hex', 'bin'];
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

// получить метаданные о файле (дата создания, последней модификации, размер и т.д.)
export function handleGetFileMetadata(absolute_path: string) {
  //const stat = fs.statSync(absolute_path);
  return fs.statSync(absolute_path);
}
