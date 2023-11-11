import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      LAPKI_FLASHER: string;
      FLASHER_LOCAL_HOST: string;
      FLASHER_SETTINGS_KEY: string;
      COMPILER_SETTINGS_KEY: string;
      PLATFORMS_PATH_SETTINGS_KEY: string;
    };
  }
}
