import { optimizer, is } from '@electron-toolkit/utils';
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import settings from 'electron-settings';

import { join } from 'path';

import {
  handleFileOpen,
  handleFileSave,
  handleFileSaveAs,
  handleSaveIntoFolder,
  handleBinFileOpen,
  handleOpenPlatformFile,
} from './file-handlers';
import {
  FLASHER_LOCAL_PORT,
  LAPKI_FLASHER,
  ModuleManager,
  ModuleStatus,
} from './modules/ModuleManager';
import { searchPlatforms } from './PlatformSeacher';

import icon from '../../resources/icon.png?asset';

import {
  COMPILER_SETTINGS,
  DEFAULT_COMPILER_HOST,
  DEFAULT_COMPILER_PORT,
  PLATFORMS_PATH_SETTINGS,
} from './consts';

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
    /*Скрыть меню при запуске(уже не требуется, см. код ниже) 
    autoHideMenuBar: true,*/
    ...(process.platform === 'win32' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
    },
  });

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
  if (!settings.hasSync(COMPILER_SETTINGS)) {
    settings.setSync(COMPILER_SETTINGS, {
      host: DEFAULT_COMPILER_HOST,
      port: DEFAULT_COMPILER_PORT,
    });
  }

  if (!settings.hasSync(PLATFORMS_PATH_SETTINGS)) {
    settings.setSync(PLATFORMS_PATH_SETTINGS, {
      path: '',
      // path: `${process.cwd()}/src/renderer/public/platform`,
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

  ipcMain.handle('dialog:openFile', (_event, platform: string, path?: string) => {
    return handleFileOpen(platform, path);
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

  ipcMain.handle('Module:reboot', (_event, module: string) => {
    ModuleManager.stopModule(module);
    ModuleManager.startLocalModule(module);
  });

  ipcMain.handle('Flasher:getPort', (_event) => {
    return FLASHER_LOCAL_PORT;
  });

  ipcMain.handle('Module:getStatus', (_event, module: string) => {
    const status: ModuleStatus = ModuleManager.getLocalStatus(module);
    return status;
  });

  ipcMain.handle('PlatformLoader:getPlatforms', async (_event) => {
    // console.log(await loadPlatforms())
    return searchPlatforms();
  });

  ipcMain.handle('PlatformLoader:openPlatformFile', (_event, absolute_path: string) => {
    return handleOpenPlatformFile(absolute_path);
  });

  // main process
  ipcMain.handle('settings:get', (_event, key) => {
    return settings.get(key);
  });
  ipcMain.handle('settings:set', (_event, key, value) => {
    return settings.set(key, value);
  });

  // Горячие клавиши для режима разрабочика:
  // - F12 – инструменты разработки
  // - CmdOrCtrl + R – перезагрузить страницу
  // См. https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  ModuleManager.startLocalModule(LAPKI_FLASHER);
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
  ModuleManager.stopModule(LAPKI_FLASHER);
  if (process.platform !== 'darwin') {
    app.quit();
  }
  //
});
