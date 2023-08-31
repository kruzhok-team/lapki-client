import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { findFreePort } from './freePortFinder';
export var FLASHER_LOCAL_HOST = 'localhost';
// FIXME: порт должен назначаться автоматически
export var FLASHER_LOCAL_PORT;

export class ModuleManager {
  static localProccesses: Map<string, ChildProcessWithoutNullStreams> = new Map();

  static async startLocalModule(module: string) {
    if (!this.localProccesses.has(module)) {
      await findFreePort((port) => {
        FLASHER_LOCAL_PORT = port;
      });
      const platform = process.platform;
      var chprocess;
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
      */
      var flasherArgs: string[] = [
        '-updateList=1',
        '-listCooldown=0',
        `-address=${FLASHER_LOCAL_HOST}:${FLASHER_LOCAL_PORT}`,
      ];
      switch (platform) {
        case 'linux':
          chprocess = spawn(`./src/main/modules/src/${platform}/${module}`, flasherArgs);
          break;
        case 'win32':
          chprocess = spawn(`src/main/modules/src/${platform}/${module}.exe`, flasherArgs);
          break;
        default:
          console.log(`Платформа ${platform} не поддерживается (:^( )`);
      }
      if (chprocess !== undefined) {
        this.localProccesses.set(module, chprocess);
        chprocess.stdout.on('data', (data) => {
          console.log(`${module}-stdout: ${data}`);
        });
        chprocess.stderr.on('data', (data) => {
          console.log(`${module}-stderr: ${data}`);
        });

        chprocess.on('exit', () => {
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
}
