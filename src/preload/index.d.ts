import { ElectronAPI } from '@electron-toolkit/preload';

export interface FlasherSettingsKeys {
  key: string;
  params: {
    remoteHost: string;
    remotePort: string;
    localHost: string;
    localPort: string;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      LAPKI_FLASHER: string;
      COMPILER_SETTINGS: string;
      FLASHER_SETTINGS: FlasherSettingsKeys;
      PLATFORMS_PATH_SETTINGS: string;
      DEFAULT_COMPILER_HOST: string;
      DEFAULT_COMPILER_PORT: number;
    };
  }
}
