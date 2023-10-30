// константы для использования electron-settings

// стандартные значения для хоста и порта загрузчика

export const DEFAULT_COMPILER_HOST: string = 'lapki.polyus-nt.ru';
export const DEFAULT_COMPILER_PORT: number = 8081;

// названия ключей electron-settings

export interface FlasherSettingsKeys {
  key: string;
  params: {
    remoteHost: string;
    remotePort: string;
    localHost: string;
    localPort: string;
  };
}

export const COMPILER_SETTINGS: string = 'compiler';
export const FLASHER_SETTINGS: FlasherSettingsKeys = {
  key: 'flasher',
  params: {
    remoteHost: 'remoteHost',
    remotePort: 'remotePort',
    localHost: 'localHost',
    localPort: 'localPort',
  },
};
export const PLATFORMS_PATH_SETTINGS: string = 'PlatformsPath';
