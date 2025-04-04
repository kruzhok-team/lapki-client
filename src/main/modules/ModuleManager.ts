import settings from 'electron-settings';
// импорт старой версии (3.0 вместо 4.0), так как новая версия требует ESM
import fixPath from 'fix-path';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

import { findFreePort } from './freePortFinder';

import { defaultSettings } from '../settings';
export type ModuleName = 'lapki-flasher';

export class ModuleStatus {
  /* 
  Статус локального модуля
    0 - не работает
    1 - работает
    2 - не смог запуститься
    3 - перестал работать
    4 - платформа не поддерживается
  */
  code: number;
  /* 
  Детали об ошибке, например консольный вывод (undefined, если отсутствует).
  Содержание в зависимости от кода (code):
    0: undefined
    1: undefined
    2: консольный вывод
    3: undefined
    4: платформа
  */
  details: string | undefined;
  constructor(code: number = 0, details: string | undefined = undefined) {
    this.code = code;
    this.details = details;
  }
}

export class ModuleManager {
  static localProccesses: Map<string, ChildProcessWithoutNullStreams> = new Map();
  static moduleStatus: Map<string, ModuleStatus> = new Map();
  static async startLocalModule(module: ModuleName) {
    this.moduleStatus.set(module, new ModuleStatus());
    if (!this.localProccesses.has(module)) {
      const platform = process.platform;
      let chprocess;
      let modulePath: string = '';
      switch (platform) {
        case 'darwin': {
          // позволяет унаследовать $PATH, то есть системный путь
          // это нужно для того, чтобы загрузчик смог получить доступ к avrdude, если путь к нему прописан в $PATH
          fixPath();
          // break не нужен, так как дальнейшие действия одинаковы для Linux, macOS и windows
        }
        // eslint-disable-next-line no-fallthrough
        case 'linux':
        case 'win32':
          modulePath = this.getModulePath(module);
          break;
        default:
          this.moduleStatus[module] = new ModuleStatus(4, platform);
          console.log(`Платформа ${platform} не поддерживается (:^( )`);
      }
      if (modulePath) {
        switch (module) {
          case 'lapki-flasher': {
            const port = await findFreePort();
            await settings.set('flasher.localPort', port);
            defaultSettings.flasher.localPort = Number(port);
            /*
            параметры локального загрузчика:
             https://github.com/kruzhok-team/lapki-flasher?tab=readme-ov-file#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%B0%D0%B8%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%BF%D0%B0%D1%80%D0%B0%D0%BC%D0%B5%D1%82%D1%80%D1%8B
            */
            const flasherArgs: string[] = [
              '-updateList=1', // скорость автоматического обновления списка в секундах
              '-listCooldown=0', // ограничение в секундах на вызов следующего ручного обновления в секундах, в данном случае отсутствует
              `-address=localhost:${port}`, // адрес локального сервера
              `-blgMbUploaderPath=${this.getBlgMbUploaderPath()}`, // путь к загрузчику кибермишки
            ];

            const avrdudePath = this.getAvrdudePath();
            const configPath = this.getConfPath();
            console.log('pathes', avrdudePath, configPath);
            if (existsSync(avrdudePath)) {
              flasherArgs.push(`-avrdudePath=${avrdudePath}`);
            }
            if (existsSync(configPath)) {
              flasherArgs.push(`-configPath=${configPath}`);
            }
            chprocess = spawn(modulePath, flasherArgs);
            break;
          }
          default:
            chprocess = spawn(modulePath);
        }
        chprocess.on('error', function (err) {
          if (err.code === 'ENOENT') {
            ModuleManager.moduleStatus.set(
              module,
              new ModuleStatus(2, `Файл ${modulePath} не найден.`)
            );
          } else {
            ModuleManager.moduleStatus.set(module, new ModuleStatus(2, `${err}`));
          }
          console.error(`${module} spawn error: ` + err);
        });
      }
      if (chprocess !== undefined) {
        ModuleManager.moduleStatus.set(module, new ModuleStatus(1));
        this.localProccesses.set(module, chprocess);
        chprocess.stdout.on('data', (data) => {
          console.log(`${module}-stdout: ${data}`);
        });
        chprocess.stderr.on('data', (data) => {
          console.log(`${module}-stderr: ${data}`);
        });

        chprocess.on('exit', () => {
          ModuleManager.moduleStatus.set(module, new ModuleStatus(3));
          console.log(`${module}-exit!`);
        });
      }
    } else {
      console.log(`${module} is already local`);
    }
  }

  static stopModule(module: ModuleName) {
    if (this.localProccesses.has(module)) {
      this.localProccesses.get(module)!.kill();
      this.localProccesses.delete(module);
    }
  }

  static getLocalStatus(module: ModuleName): ModuleStatus {
    return this.moduleStatus.get(module)!;
  }

  static getOsPath(): string {
    const basePath = path
      .join(__dirname, '../../resources')
      .replace('app.asar', 'app.asar.unpacked');
    return `${basePath}/modules/${process.platform}`;
  }

  static getOsExe(executable: string): string {
    if (process.platform === 'win32') {
      return `${executable}.exe`;
    } else if (
      (process.platform === 'linux' || process.platform === 'darwin') &&
      !executable.includes('/')
    ) {
      return './' + executable;
    }
    return executable;
  }

  static getAvrdudePath(): string {
    return this.getOsExe(`${this.getOsPath()}/avrdude`);
  }

  static getConfPath(): string {
    return `${this.getOsPath()}/avrdude.conf`;
  }

  static getBlgMbUploaderPath(): string {
    return this.getOsExe(`${this.getOsPath()}/blg-mb-1/blg-mb-1-uploader`);
  }

  static getModulePath(module: string): string {
    return this.getOsExe(`${this.getOsPath()}/${module}`);
  }
}
