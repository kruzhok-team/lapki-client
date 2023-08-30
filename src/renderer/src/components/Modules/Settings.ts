export interface CompilerSettings {
  host: string;
  port: number;
}

export class Settings {
  static async get(key: string): Promise<any> {
    return await window.electron.ipcRenderer.invoke('settings:get', key);
  }

  static async getCompilerSettings(): Promise<CompilerSettings> {
    return await this.get('compiler');
  }
}
