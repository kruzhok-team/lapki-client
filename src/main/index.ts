import { optimizer, is } from '@electron-toolkit/utils';
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import settings from 'electron-settings';

import { join } from 'path';

import { checkForUpdates } from './checkForUpdates';
import { initFileHandlersIPC } from './file-handlers';
import { ModuleName, ModuleManager } from './modules/ModuleManager';
import { initSettings, settingsChangeSend } from './settings';
import { getAllTemplates, getTemplate } from './templates';

import icon from '../../resources/icon.png?asset';

/**
 * Создание главного окна редактора.
 */
function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    resizable: true, // запрет на изменение размеров окна
    minHeight: 600,
    minWidth: 1000,
    /*Скрыть меню при запуске(уже не требуется, см. код ниже) 
    autoHideMenuBar: true,*/
    ...(process.platform === 'win32' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
    },
  });

  let shouldClose = false; // Флаг для того чтобы можно было закрыть на крестик после открытия окна сохранения

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.code === 'KeyW') {
      event.preventDefault();
    }
  });

  // Разворачиваем окно на весь экран
  mainWindow.maximize();
  //Навсегда скрывает верхнее меню электрона, не блокируя при этом остальные комбинации клавиш
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  //Запрос в область рендера
  mainWindow.on('close', (e) => {
    if (!mainWindow) return;

    if (!shouldClose) {
      e.preventDefault();
      mainWindow.webContents.send('app-close');
    }
    shouldClose = true;
  });

  ipcMain.on('reset-close', () => {
    shouldClose = false;
  });

  //Получаем ответ из рендера и закрываем приложение
  ipcMain.on('closed', () => {
    ModuleManager.stopModule('lapki-flasher');
    app.exit(0);
  });

  // Вместо создания новых окон мы передаём ссылку в систему.
  // Позже здесь можно отрабатывать отдельные случаи.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  ipcMain.handle('devtools', () => {
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

  initSettings(mainWindow.webContents);

  return mainWindow;
}

const startFlasher = async () => {
  ModuleManager.startLocalModule('lapki-flasher');
};
startFlasher();

// Выполняется после инициализации Electron
app.whenReady().then(() => {
  const mainWindow = createWindow();
  initFileHandlersIPC();

  ipcMain.handle('Module:reboot', async (_event, module: ModuleName) => {
    ModuleManager.stopModule(module);
    await ModuleManager.startLocalModule(module);
    if (module === 'lapki-flasher') {
      settingsChangeSend(mainWindow.webContents, 'flasher', settings.getSync('flasher'));
    }
  });

  ipcMain.handle('Module:getStatus', (_event, module: ModuleName) => {
    return ModuleManager.getLocalStatus(module);
  });

  ipcMain.handle('appVersion', app.getVersion);

  ipcMain.handle('getAllTemplates', getAllTemplates);

  ipcMain.handle('getTemplateData', (_, type: string, name: string) => getTemplate(type, name));

  ipcMain.handle('checkForUpdates', checkForUpdates(app.getVersion()));

  // Горячие клавиши для режима разрабочика:
  // - F12 – инструменты разработки
  // - CmdOrCtrl + R – перезагрузить страницу
  // См. https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('activate', function () {
    // Восстановление окна для macOS.
    // После закрытия окон приложение не завершается и висит в доке.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Завершаем приложение, когда окна закрыты.
app.on('window-all-closed', () => {
  // явно останавливаем загрузчик, так как в некоторых случаях он остаётся висеть
  ModuleManager.stopModule('lapki-flasher');
  app.quit();
});
