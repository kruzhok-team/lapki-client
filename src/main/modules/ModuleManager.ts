import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';

import { findFreePort } from './freePortFinder';
export const FLASHER_LOCAL_HOST: string = 'localhost';
export let FLASHER_LOCAL_PORT: number;
// название локального загрузчика
export const LAPKI_FLASHER: string = 'lapki-flasher';

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
  static async startLocalModule(module: string) {
    this.moduleStatus[module] = new ModuleStatus();
    if (!this.localProccesses.has(module)) {
      if (module == LAPKI_FLASHER) {
        await findFreePort((port) => {
          FLASHER_LOCAL_PORT = port;
        });
      }
      const platform = process.platform;
      const basePath = path
        .join(__dirname, '../../resources')
        .replace('app.asar', 'app.asar.unpacked'); // process.resourcesPath;
      let chprocess;
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
        `-address=${FLASHER_LOCAL_HOST}:${FLASHER_LOCAL_PORT}`,
      ];
      let modulePath: string = '';
      switch (platform) {
        case 'linux': {
          const osPath = `${basePath}/modules/${platform}`;
          modulePath = `${osPath}/${module}`;
          flasherArgs.push(`-avrdudePath=${osPath}/avrdude`);
          flasherArgs.push(`-configPath=${osPath}/avrdude.conf`);
          break;
        }
        case 'win32': {
          const osPath = `${basePath}\\modules\\${platform}`;
          modulePath = `${osPath}\\${module}.exe`;
          flasherArgs.push(`-avrdudePath=${osPath}\\avrdude.exe`);
          flasherArgs.push(`-configPath=${osPath}\\avrdude.conf`);
          break;
        }
        default:
          this.moduleStatus[module] = new ModuleStatus(4, platform);
          console.log(`Платформа ${platform} не поддерживается (:^( )`);
      }
      if (modulePath) {
        console.log(modulePath, flasherArgs);
        chprocess = spawn(modulePath, flasherArgs);
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

  static stopModule(module: string) {
    if (this.localProccesses.has(module)) {
      this.localProccesses.get(module)!.kill();
      this.localProccesses.delete(module);
    }
  }

  static getLocalStatus(module: string) {
    return this.moduleStatus[module];
  }
}
