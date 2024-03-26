import settings from 'electron-settings';
import { lookpath } from 'lookpath';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

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
    this.moduleStatus[module] = new ModuleStatus();
    if (!this.localProccesses.has(module)) {
      const platform = process.platform;
      const basePath = path
        .join(__dirname, '../../resources')
        .replace('app.asar', 'app.asar.unpacked'); // process.resourcesPath;
      let chprocess;
      let modulePath: string = '';
      let osPath = '';
      switch (platform) {
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
            const port = await settings.get('flasher.localPort');
            /*
            параметры локального загрузчика:
              -address string
                  адресс для подключения (default "localhost:8080")
              -fileSize int
                  максимальный размер файла, загружаемого на сервер (в байтах) (default 2097152)
              -listCooldown int
                  минимальное время (в секундах), через которое клиент может снова запросить список устройств, игнорируется, если количество клиентов меньше чем 2 (default 2)      
              -msgSize int
                  максмальный размер одного сообщения, передаваемого через веб-сокеты (в байтах) (default 1024)
              -thread int
                  максимальное количество потоков (горутин) на обработку запросов на одного клиента (default 3)
              -updateList int
                  количество секунд между автоматическими обновлениями (default 15)
              -verbose
                  выводить в консоль подробную информацию
              -alwaysUpdate
                  всегда искать устройства и обновлять их список, даже когда ни один клиент не подключён (в основном требуется для тестирования)
              -stub
                  количество ненастоящих, симулируемых устройств, которые будут восприниматься как настоящие, применяется для тестирования, при значении 0 или меньше фальшивые устройства не добавляются (по-умолчанию 0)
              -avrdudePath 
                  путь к avrdude (по-умолчанию avrdude, то есть будет использоваться системный путь)
              -configPath 
                  путь к файлу конфигурации avrdude (по-умолчанию '', то есть пустая строка)
            */
            const flasherArgs: string[] = [
              '-updateList=1',
              '-listCooldown=0',
              `-address=localhost:${port}`,
            ];

            let avrdudePath = '';
            let configPath = '';
            switch (platform) {
              case 'linux':
                avrdudePath = `${osPath}/avrdude`;
                configPath = `${osPath}/avrdude.conf`;
                break;
              case 'win32':
                avrdudePath = `${osPath}\\avrdude.exe`;
                configPath = `${osPath}\\avrdude.conf`;
                break;
            }
            const AVRDUDE_SETTING = 'flasher.avrdude';
            if (existsSync(avrdudePath)) {
              flasherArgs.push(`-avrdudePath=${avrdudePath}`);
              settings.setSync(AVRDUDE_SETTING, true);
              console.log('AVRDUDE TRUE');
            } else {
              await lookpath('avrdude').then((path: string | undefined) => {
                if (path) {
                  settings.set(AVRDUDE_SETTING, true);
                } else {
                  settings.set(AVRDUDE_SETTING, false);
                }
              });
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
          if (err.code == 'ENOENT') {
            ModuleManager.moduleStatus[module] = new ModuleStatus(
              2,
              `Файл ${modulePath} не найден.`
            );
          } else {
            ModuleManager.moduleStatus[module] = new ModuleStatus(2, `${err}`);
          }
          console.error(`${module} spawn error: ` + err);
        });
      }
      if (chprocess !== undefined) {
        ModuleManager.moduleStatus[module] = new ModuleStatus(1);
        this.localProccesses.set(module, chprocess);
        chprocess.stdout.on('data', (data) => {
          console.log(`${module}-stdout: ${data}`);
        });
        chprocess.stderr.on('data', (data) => {
          console.log(`${module}-stderr: ${data}`);
        });

        chprocess.on('exit', () => {
          ModuleManager.moduleStatus[module] = new ModuleStatus(3);
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
    return this.moduleStatus[module];
  }
}
