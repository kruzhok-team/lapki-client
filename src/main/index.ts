import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import fs from 'fs';
import { optimizer, is } from '@electron-toolkit/utils';

//import icon from '../../resources/icon.png?asset';

let NameFile: string;
/**
 * Асинхронный диалог открытия файла схемы.
 * @returns Promise
 */
async function handleFileOpen() {
  return new Promise(async (resolve, reject) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'json', extensions: ['json'] }],
      properties: ['openFile'],
    });
    NameFile = filePaths[0];
    if (!canceled && filePaths[0]) {
      fs.readFile(filePaths[0], 'utf-8', (err, date) => {
        if (err) {
          return reject(new Error('An error ocсurred reading the file :' + err.message));
        }
        var FileDate = [path.basename(filePaths[0]), date];
        resolve(FileDate);
      });
    }
  });
}

/**
 * Асинхронное сохранение файла схемы.
 * @returns Promise
 */
async function handleFileSave(data) {
  return new Promise(async () => {
    await fs.writeFile(NameFile, data, function (err) {
      if (err) throw err;
      console.log('Сохранено!');
    });
  });
}

/**
 * Асинхронный диалог сохранения файла схемы.
 * @returns Promise
 */
async function handleFileSaveAs(data) {
  return new Promise(async () => {
    await dialog
      .showSaveDialog({
        title: 'Выберите путь к файлу для сохранения',
        defaultPath: path.join(__dirname, NameFile),
        buttonLabel: 'Сохранить',
        filters: [{ name: 'json', extensions: ['json'] }],
      })
      .then((file) => {
        if (!file.canceled) {
          // Создание и запись в файл
          if (typeof file.filePath === 'string') {
            fs.writeFile(file.filePath?.toString(), data, function (err) {
              if (err) throw err;
              console.log('Сохранено!');
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
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

  ipcMain.handle('dialog:saveFile', (_event, data) => {
    return handleFileSave(data);
  });

  ipcMain.handle('dialog:saveAsFile', (_event, data) => {
    return handleFileSaveAs(data);
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
