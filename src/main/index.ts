import { optimizer, is } from '@electron-toolkit/utils';
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import {
  handleFileOpen,
  handleFileSave,
  handleFileSaveAs,
  handleSaveIntoFolder,
  handleBinFileOpen,
} from './file-handlers';
import { join } from 'path';
import { FLASHER_LOCAL_PORT, ModuleManager } from './modules/ModuleManager';

import icon from '../../resources/icon.png?asset';
import settings from 'electron-settings';

/**
 * Создание главного окна редактора.
 */
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    resizable: true, // запрет на изменение размеров окна
    minHeight: 600,
    minWidth: 1000,
    autoHideMenuBar: true,
    ...(process.platform === 'win32' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
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

  ipcMain.handle('devtools', (_event) => {
    mainWindow.webContents.openDevTools();
  });

  // Развилка для горячей пересборки через Electron-Vite.
  // В режиме разработки открываем особый адрес, в релизе – собранный HTML-файл
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    // Открываем инструменты разработчика
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function initSettings(): void {
  console.log('getting settings from', settings.file());
  if (!settings.hasSync('compiler')) {
    settings.setSync('compiler', {
      host: 'lapki.polyus-nt.ru',
      port: 8081,
    });
  }
}

// Выполняется после инициализации Electron
app.whenReady().then(() => {
  initSettings();

  // IPC из отрисовщика, в основном диалоговые окна
  ipcMain.handle('dialog:saveIntoFolder', (_event, data) => {
    return handleSaveIntoFolder(data);
  });

  ipcMain.handle('dialog:openFile', (_event, platform: string) => {
    return handleFileOpen(platform);
  });

  ipcMain.handle('dialog:saveFile', (_event, filename, data) => {
    return handleFileSave(filename, data);
  });

  ipcMain.handle('dialog:saveAsFile', (_event, filename, data) => {
    return handleFileSaveAs(filename, data);
  });

  ipcMain.handle('dialog:openBinFile', (_event) => {
    return handleBinFileOpen();
  });

  ipcMain.handle('Module:startLocalModule', (_event, module: string) => {
    return ModuleManager.startLocalModule(module);
  });

  ipcMain.handle('Module:stopLocalModule', (_event, module: string) => {
    return ModuleManager.stopModule(module);
  });

  ipcMain.handle('Flasher:getPort', (_event) => {
    return FLASHER_LOCAL_PORT;
  });

  ipcMain.handle('Module:getStatus', (_event, module: string) => {
    return ModuleManager.getLocalStatus(module);
  });

  // main process
  ipcMain.handle('settings:get', (_event, key) => {
    return settings.get(key);
  });

  // Горячие клавиши для режима разрабочика:
  // - F12 – инструменты разработки
  // - CmdOrCtrl + R – перезагрузить страницу
  // См. https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  ModuleManager.startLocalModule('lapki-flasher');
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
  // явно останавливаем загрузчик, так как в некоторых случаях он остаётся висеть
  ModuleManager.stopModule('lapki-flasher');
  if (process.platform !== 'darwin') {
    app.quit();
  }
  //
});
