import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import fs from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
//import icon from '../../resources/icon.png?asset';

async function handleFileOpen() {
  return new Promise(async (resolve, reject) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    if (!canceled && filePaths[0]) {
      fs.readFile(filePaths[0], 'utf-8', (err, date) => {
        if (err) {
          return reject(new Error('An error ocurred reading the file :' + err.message));
        }
        var FileDate = [path.basename(filePaths[0]), date];
        resolve(FileDate);
      });
    }
  });
}

/*async function handleFileSave() {
  return new Promise(async (resolve, reject) => {
    const { canceled, filePaths } = await dialog.showSaveDialog({
      properties: [''],
    });
    if (!canceled && filePaths[0]) {
      fs.readFile(filePaths[0], 'utf-8', (err, date) => {
        if (err) {
          return reject(new Error('An error ocurred reading the file :' + err.message));
        }
        var FileDate = [path.basename(filePaths[0]), date];
        resolve(FileDate);
      });
    }
  });
}*/

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    //Запрет на изменение размеров окна
    //resizable: false,
    minHeight: 768,
    minWidth: 1366,
    autoHideMenuBar: true,
    //...(process.platform === 'win32' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  //Максимальный размер окна
  mainWindow.maximize();

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // custom apis
  ipcMain.handle('dialog:openFile', handleFileOpen);

  // custom apis
  //ipcMain.handle('dialog:saveFile', handleFileSave);

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
