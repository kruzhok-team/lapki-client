export interface CompilerSettings {
  host: string;
  port: number;
}

export interface PlatfromDirectory {
  path: string;
}
export class Settings {
  static async get(key: string): Promise<any> {
    return await window.electron.ipcRenderer.invoke('settings:get', key);
  }

  static async getCompilerSettings(): Promise<CompilerSettings> {
    return await this.get('compiler');
  }

  static async getPlatformPath(): Promise<PlatfromDirectory> {
    return await this.get('PlatformsPath');
  }
}
