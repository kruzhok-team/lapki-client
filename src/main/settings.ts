import { ipcMain, WebContents } from 'electron';
import settings from 'electron-settings';

import { existsSync } from 'fs';

import { defaultCompilerHost, defaultCompilerPort, defaultDocHost } from './version';

type MetaType =
  | {
      RefBlHw: string; // Описывает физическое окружение контроллера (плату)
      RefBlFw: string; // Указывает на версию прошивки загрузчика
      RefBlUserCode: string; //
      RefBlChip: string; // Указывает на контроллер, здесь то, что нужно для компиляции прошивки
      RefBlProtocol: string; // Описывает возможности протокола загрузчика
      RefCgHw: string; // Указывает на аппаратное исполнение
      RefCgFw: string; // Указывает на версию прошивки кибергена
      RefCgProtocol: string; // Указывает на возможности протокола кибергена
    }
  | undefined;

type AddressBook = {
  name: string;
  address: string;
  type: string;
  meta: MetaType;
};

type StateMachineInfo = {
  name: string;
  platformIdx: string;
};

type RecentFile = {
  name: string;
  path: string;
  stateMachines: StateMachineInfo[];
};

export const defaultSettings = {
  doc: {
    host: 'http://localhost:8071/', // FIXME: реализовать авто поиск порта
    remoteHost: defaultDocHost,
    type: 'local' as 'local' | 'remote',
  },
  compiler: {
    host: defaultCompilerHost,
    port: defaultCompilerPort,
  },
  flasher: {
    host: 'localhost',
    port: 0,
    localPort: 0, //! Это ручками менять нельзя, инициализируется при запуске
    type: 'local' as 'local' | 'remote',
  },
  // см. SerialMonitor.tsx в renderer для того, чтобы узнать допустимые значения
  serialmonitor: {
    /**
     * скорость передачи данных
     */
    baudRate: 9600,
    /**
     * символ переноса строки в конце сообщения от клиента на устройство
     */
    lineBreak: 'LF' as 'LF' | 'CR' | 'CRLF' | 'EMPTY',
    /**
     * Если true, то будет автоматическая прокрутка окна с логами
     */
    autoScroll: true,
    textMode: 'text' as 'text' | 'hex',
  },
  platformsPath: '',
  theme: 'light' as 'light' | 'dark',
  canvas: {
    animations: true,
    grid: true,
  },
  /**
   * Записи адресной книги МС-ТЮК.
   */
  addressBookMS: [] as AddressBook[],
  /**
   * Параметры менеджера МС-ТЮК
   */
  managerMS: {
    /**
     * Параметр, отправляемый загрузчику при запросе прошивки.
     * Если true, то загрузчик потратит дополнительное время на проверку прошивки.
     */
    verification: false,
    /**
     * Если true, то будет автоматическая прокрутка окна с логами
     */
    autoScroll: true,
    /**
     * Если true, то будет показываться инструкция по получению адреса
     */
    hideGetAddressModal: false,
  },
  autoSave: {
    /**
     * Количество секунд между авто сохранениями.
     */
    interval: 120,
    disabled: false,
  },
  recentFiles: [] as RecentFile[],
};

export type Settings = typeof defaultSettings;
export type SettingsKey = keyof Settings;
const noResetKeys: SettingsKey[] = ['addressBookMS', 'recentFiles'];

/**
 * Удаление недавних файлов, пути которых невозможно отыскать
 */
const checkRecentFiles = () => {
  const key = 'recentFiles' as SettingsKey;
  const files = settings.getSync(key) as RecentFile[];
  settings.setSync(
    key,
    files.filter((file) => existsSync(file.path))
  );
};

export const initSettings = () => {
  for (const key in defaultSettings) {
    if (!settings.hasSync(key)) {
      settings.setSync(key, defaultSettings[key]);
    }
  }
  checkRecentFiles();
  // (Roundabout1): костыль, нужно будет реализовать проверку наличия всех значений для ключей при инициализации.
  const monitorSettings = settings.getSync('serialmonitor' as SettingsKey);
  if (monitorSettings && !monitorSettings['textMode']) {
    settings.setSync('serialmonitor.textMode', 'text');
  }
};

export const initSettingsHandlers = (webContents: WebContents) => {
  ipcMain.handle('settings:get', (_event, key) => {
    return settings.get(key);
  });
  ipcMain.handle('settings:set', async (_event, key: SettingsKey, value) => {
    await settingsChange(webContents, key, value);
  });
  ipcMain.handle('settings:reset', async (_event, key: SettingsKey) => {
    await settingsChange(webContents, key, defaultSettings[key]);
  });
  ipcMain.handle('settings:fullReset', async () => {
    for (const key in defaultSettings) {
      if (noResetKeys.findIndex((v) => v === key) === -1) {
        await settingsChange(webContents, key as SettingsKey, defaultSettings[key]);
      }
    }
  });
};

// изменение настройки и отправка сообщения через webContents
async function settingsChange(webContents: WebContents, key: SettingsKey, value) {
  await settings.set(key, value);

  settingsChangeSend(webContents, key, value);
}

// отправка сообщения об изменение настроек через webContents
export function settingsChangeSend(webContents: WebContents, key: SettingsKey, value) {
  webContents.send(`settings:change:${key}`, value);
}
