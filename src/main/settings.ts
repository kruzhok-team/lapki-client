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
    host: 'localhost',
    port: 0,
    localPort: 0, //! Это ручками менять нельзя, инициализируется при запуске
    type: 'local' as 'local' | 'remote',
  },
  platformsPath: '',
  theme: 'light' as 'light' | 'dark',
  canvas: {
    animations: true,
    grid: true,
  },
};

export type Settings = typeof defaultSettings;

export const initSettings = (webContents: WebContents) => {
  for (const key in defaultSettings) {
    if (!settings.hasSync(key)) {
      settings.setSync(key, defaultSettings[key]);
    }
  }

  ipcMain.handle('settings:get', (_event, key) => {
    return settings.get(key);
  });
  ipcMain.handle('settings:set', async (_event, key: string, value) => {
    await settings_change(webContents, key, value);
  });
  ipcMain.handle('settings:reset', async (_event, key: string) => {
    await settings_change(webContents, key, defaultSettings[key]);
  });
};

// изменение настройки и отправка сообщения через webContents
export async function settings_change(webContents: WebContents, key: string, value) {
  await settings.set(key, value);

  webContents.send(`settings:change:${key}`, value);
}
