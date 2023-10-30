export interface CompilerSettings {
  host: string;
  port: number;
}

export interface FlasherSettings {
  remoteHost: string | null;
  remotePort: number | null;
  localHost: string;
  localPort: number;
}

export interface PlatfromDirectory {
  path: string;
}
export class Settings {
  static async get(key: string): Promise<any> {
    return await window.electron.ipcRenderer.invoke('settings:get', key);
  }

  static async set(key: string, value: any): Promise<any> {
    return await window.electron.ipcRenderer.invoke('settings:set', key, value);
  }

  private static property(key: string, param: string) {
    return `${key}.${param}`;
  }

  static async getCompilerSettings(): Promise<CompilerSettings> {
    return await this.get(window.api.COMPILER_SETTINGS);
  }

  static async setCompilerSettings(value: CompilerSettings): Promise<CompilerSettings> {
    return await this.set(window.api.COMPILER_SETTINGS, value);
  }

  static async getPlatformPath(): Promise<PlatfromDirectory> {
    return await this.get(window.api.PLATFORMS_PATH_SETTINGS);
  }

  static async getFlasherSettings(): Promise<FlasherSettings> {
    return await this.get(window.api.FLASHER_SETTINGS.key);
  }

  static async setFlasherSettings(value: FlasherSettings): Promise<FlasherSettings> {
    return await this.set(window.api.FLASHER_SETTINGS.key, value);
  }

  static async setFlasherRemotePort(port: number): Promise<number> {
    return await this.set(
      this.property(window.api.FLASHER_SETTINGS.key, window.api.FLASHER_SETTINGS.params.remotePort),
      port
    );
  }

  static async setFlasherRemoteHost(host: string): Promise<string> {
    return await this.set(
      this.property(window.api.FLASHER_SETTINGS.key, window.api.FLASHER_SETTINGS.params.remoteHost),
      host
    );
  }
}
