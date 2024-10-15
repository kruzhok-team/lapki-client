import settings from 'electron-settings';
// импорт старой версии (3.0 вместо 4.0), так как новая версия требует ESM
import fixPath from 'fix-path';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
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
      const basePath = path
        .join(__dirname, '../../resources')
        .replace('app.asar', 'app.asar.unpacked'); // process.resourcesPath;
      let chprocess;
      let modulePath: string = '';
      let osPath = '';
      switch (platform) {
        case 'darwin': {
          // позволяет унаследовать $PATH, то есть системный путь
          // это нужно для того, чтобы загрузчик смог получить доступ к avrdude, если путь к нему прописан в $PATH
          fixPath();
          // break не нужен, так как дальнейшие действия одинаковы для Linux и macOS
        }
        // eslint-disable-next-line no-fallthrough
        case 'linux': {
          osPath = `${basePath}/modules/${platform}`;
          modulePath = `${osPath}/${module}`;
          break;
        }
        case 'win32': {
          osPath = `${basePath}\\modules\\${platform}`;
          modulePath = `${osPath}\\${module}.exe`;
          break;
        }
        default:
          this.moduleStatus[module] = new ModuleStatus(4, platform);
          console.log(`Платформа ${platform} не поддерживается (:^( )`);
      }
      if (modulePath) {
        switch (module) {
          case 'lapki-flasher': {
            const port = await findFreePort();
            settings.setSync('flasher.localPort', port);
            defaultSettings.flasher.localPort = Number(port);
            /*
            параметры локального загрузчика (https://github.com/kruzhok-team/lapki-flasher/blob/main/README.md#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%B0%D0%B8%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%BF%D0%B0%D1%80%D0%B0%D0%BC%D0%B5%D1%82%D1%80%D1%8B):
              -address
                  адресс для подключения
              -listCooldown
                  минимальное время (в секундах), через которое клиент может снова запросить список устройств, игнорируется, если количество клиентов меньше чем 2      
              -updateList
                  количество секунд между автоматическими обновлениями
              -local
                  локальный режим, ограничивает кол-во клиентов до одного и даёт права администратора для совершения особых действий по-умолчанию
              -avrdudePath
                  путь к программе avrdude, необходима для прошивки arduino-подобных устройств, по-умолчанию используется системный путь ('avrdude').
              -configPath
                  путь к файлу конфигурации avrdude, если не указать, то будет использоваться тот файл, что находится в одной папке с avrdude.
            */
            const flasherArgs: string[] = [
              '-updateList=1',
              '-listCooldown=0',
              `-address=localhost:${port}`,
              '-local',
              `-avrdudePath=${
                settings.getSync('flasher.avrdudePath') ?? defaultSettings.flasher.avrdudePath
              }`,
              `-configPath=${
                settings.getSync('flasher.configPath') ?? defaultSettings.flasher.configPath
              }`,
            ];
            chprocess = spawn(modulePath, flasherArgs);
            break;
          }
          default:
            chprocess = spawn(modulePath);
        }
        chprocess.on('error', function (err) {
          if (err.code == 'ENOENT') {
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
}
