import { ElectronAPI } from '@electron-toolkit/preload';

import { getSetting, Settings } from '../main/settings';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      LAPKI_FLASHER: string;
      FLASHER_LOCAL_HOST: string;
      FLASHER_SETTINGS_KEY: string;
      COMPILER_SETTINGS_KEY: string;
      PLATFORMS_PATH_SETTINGS_KEY: string;
      DEFAULT_COMPILER_SETTINGS;
      DOC_SETTINGS_KEY: string;
      DEFAULT_DOC_SETTINGS;
    };
  }
  //! Это только тип, значения тут нет
  interface Main {
    settings: Settings;
  }
}
