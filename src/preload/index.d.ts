import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      FLASHER_LOCAL_HOST: string;
      LAPKI_FLASHER: string;
    };
  }
}
