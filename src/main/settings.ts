import { ipcMain, WebContents } from 'electron';
import settings from 'electron-settings';

const defaultSettings = {
  doc: {
    host: 'https://lapki-doc.polyus-nt.ru/',
  },
  compiler: {
    host: 'lapki.polyus-nt.ru',
    port: 8081,
  },
  flasher: {
    host: null as string | null,
    port: null as number | null,
  },
  platformsPath: '',
};

export type Settings = typeof defaultSettings;

export const initSettings = (webContents: WebContents) => {
  for (const key in defaultSettings) {
    if (!settings.has(key)) {
      settings.set(key, defaultSettings[key]);
    }
  }

  ipcMain.handle('settings:get', (_event, key) => {
    return settings.get(key);
  });
  ipcMain.handle('settings:set', async (_event, key, value) => {
    await settings.set(key, value);

    webContents.send(`settings:change:${key}`, value);
  });
  ipcMain.handle('settings:reset', async (_event, key) => {
    await settings.set(key, defaultSettings[key]);

    webContents.send(`settings:change:${key}`, defaultSettings[key]);
  });
};
