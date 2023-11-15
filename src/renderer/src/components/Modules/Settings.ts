export interface CompilerSettings {
  host: string;
  port: number;
}

export interface FlasherSettings {
  host: string | null;
  port: number | null;
}

export interface PlatfromDirectory {
  path: string;
}
export class Settings {
  static async get(key: string): Promise<any> {
    return await window.electron.ipcRenderer.invoke('settings:get', key);
  }

  static async set(key: string, value: any) {
    window.electron.ipcRenderer.invoke('settings:set', key, value);
  }

  static async getCompilerSettings(): Promise<CompilerSettings> {
    return await this.get(window.api.COMPILER_SETTINGS_KEY);
  }

  static async setCompilerSettings(value: CompilerSettings) {
    this.set(window.api.COMPILER_SETTINGS_KEY, value);
  }

  static async getPlatformPath(): Promise<PlatfromDirectory> {
    return await this.get(window.api.PLATFORMS_PATH_SETTINGS_KEY);
  }

  static async getFlasherSettings(): Promise<FlasherSettings> {
    return await this.get(window.api.FLASHER_SETTINGS_KEY);
  }

  static async setFlasherSettings(value: FlasherSettings) {
    await this.set(window.api.FLASHER_SETTINGS_KEY, value);
  }
}
