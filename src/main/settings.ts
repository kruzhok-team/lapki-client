import { ipcMain, WebContents } from 'electron';
import settings from 'electron-settings';

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

export const defaultSettings = {
  doc: {
    host: 'https://lapki-doc.polyus-nt.ru/v/0.2.1/',
  },
  compiler: {
    host: 'lapki.polyus-nt.ru',
    port: 8082,
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
  },
  platformsPath: '',
  theme: 'light' as 'light' | 'dark',
  canvas: {
    animations: true,
    grid: true,
  },
  /**
   * Записи адресной книги МС-ТЮК.
   *
   * Первым элементов является заголовок таблицы, он всегда должен присутствовать.
   */
  addressBookMS: [
    {
      name: 'Имя',
      address: 'Адрес',
      type: 'Тип',
      meta: undefined as MetaType,
    },
  ],
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
  },
};

export type Settings = typeof defaultSettings;
export type SettingsKey = keyof Settings;

export const initDefaultSettings = () => {
  for (const key in defaultSettings) {
    if (!settings.hasSync(key)) {
      settings.setSync(key, defaultSettings[key]);
    }
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
      if ((key as SettingsKey) != 'addressBookMS') {
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
