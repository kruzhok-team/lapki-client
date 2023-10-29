import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      FLASHER_LOCAL_HOST: string;
      LAPKI_FLASHER: string;
      COMPILER_SETTINGS: string;
      PLATFORMS_PATH_SETTINGS: string;
      DEFAULT_COMPILER_HOST: string;
      DEFAULT_COMPILER_PORT: number;
    };
  }
}
