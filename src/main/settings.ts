import { IpcMain, ipcRenderer } from 'electron';
import settings from 'electron-settings';

export const DEFAULT_COMPILER_SETTINGS = {
  host: 'lapki.polyus-nt.ru',
  port: 8081,
};

export const DEFAULT_DOC_SETTINGS = {
  host: 'https://lapki-doc.polyus-nt.ru/',
};

// названия ключей electron-settings

export const COMPILER_SETTINGS_KEY: string = 'compiler';
export const FLASHER_SETTINGS_KEY: string = 'flasher';
export const DOC_SETTINGS_KEY: string = 'doc';
export const PLATFORMS_PATH_SETTINGS_KEY: string = 'PlatformsPath';

const defaultSettings = {
  doc: {
    host: 'https://lapki-doc.polyus-nt.ru/',
  },
  compiler: {
    host: 'lapki.polyus-nt.ru',
    port: 8081,
  },
  flasher: {
    host: null,
    port: null,
  },
  platforms: {
    path: '',
  },
};

export type Settings = typeof defaultSettings;

// export interface Settings {
//   doc: {
//     host: string;
//   };
//   // LAPKI_FLASHER: string;
//   // FLASHER_LOCAL_HOST: string;
//   // FLASHER_SETTINGS_KEY: string;
//   // COMPILER_SETTINGS_KEY: string;
//   // PLATFORMS_PATH_SETTINGS_KEY: string;
//   // DEFAULT_COMPILER_SETTINGS;
//   // DOC_SETTINGS_KEY: string;
//   // DEFAULT_DOC_SETTINGS;
// }

export const initSettings = (ipcMain: IpcMain) => {
  for (const key in defaultSettings) {
    if (!settings.has(key)) {
      settings.set(key, defaultSettings[key]);
    }
  }

  // console.log('getting settings from', settings.file());

  // if (!settings.hasSync(COMPILER_SETTINGS_KEY)) {
  //   settings.setSync(COMPILER_SETTINGS_KEY, DEFAULT_COMPILER_SETTINGS);
  // }

  // if (!settings.hasSync(PLATFORMS_PATH_SETTINGS_KEY)) {
  //   settings.setSync(PLATFORMS_PATH_SETTINGS_KEY, {
  //     path: '',
  //     // path: `${process.cwd()}/src/renderer/public/platform`,
  //   });
  // }

  // if (!settings.hasSync(FLASHER_SETTINGS_KEY)) {
  //   settings.setSync(FLASHER_SETTINGS_KEY, {
  //     host: null,
  //     port: null,
  //   });
  // }

  // if (!settings.hasSync(DOC_SETTINGS_KEY)) {
  //   settings.setSync(DOC_SETTINGS_KEY, DEFAULT_DOC_SETTINGS);
  // }

  ipcMain.handle('settings:get', (_event, key) => {
    return settings.get(key);
  });
  ipcMain.handle('settings:set', (_event, key, value) => {
    return settings.set(key, value);
  });
};

export const getSetting = <T extends keyof Settings>(key: T): Promise<Settings[T]> => {
  return ipcRenderer.invoke('settings:get', key);
};
