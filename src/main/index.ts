import { optimizer, is } from '@electron-toolkit/utils';
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';

import fs from 'fs';
import { join, basename } from 'path';

//import icon from '../../resources/icon.png?asset';

/**
 * Асинхронный диалог открытия файла схемы.
 * @returns Promise
 */
async function handleFileOpen() {
  return new Promise(async (resolve, _reject) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'json', extensions: ['json'] }],
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

/**
 * Асинхронное сохранение файла схемы.
 * @returns Promise
 */
async function handleFileSave(fileName, data) {
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
async function handleFileSaveAs(filename, data) {
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
 * Создание главного окна редактора.
 */
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    //resizable: false, // запрет на изменение размеров окна
    minHeight: 768,
    minWidth: 1366,
    autoHideMenuBar: true,
    //...(process.platform === 'win32' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  // Разворачиваем окно на весь экран
  mainWindow.maximize();

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Вместо создания новых окон мы передаём ссылку в систему.
  // Позже здесь можно отрабатывать отдельные случаи.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Развилка для горячей пересборки через Electron-Vite.
  // В режиме разработки открываем особый адрес, в релизе – собранный HTML-файл
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Открываем инструменты разработчика
  mainWindow.webContents.openDevTools();
}

// Выполняется после инициализации Electron
app.whenReady().then(() => {
  // IPC из отрисовщика, в основном диалоговые окна

  ipcMain.handle('dialog:openFile', handleFileOpen);

  ipcMain.handle('dialog:saveFile', (_event, filename, data) => {
    return handleFileSave(filename, data);
  });

  ipcMain.handle('dialog:saveAsFile', (_event, filename, data) => {
    return handleFileSaveAs(filename, data);
  });

  // Горячие клавиши для режима разрабочика:
  // - F12 – инструменты разработки
  // - CmdOrCtrl + R – перезагрузить страницу
  // См. https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    // Восстановление окна для macOS.
    // После закрытия окон приложение не завершается и висит в доке.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Завершаем приложение, когда окна закрыты.
// Кроме macOS, там выход явный, через Cmd+Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  //
});
