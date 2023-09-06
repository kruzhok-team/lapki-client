import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { findFreePort } from './freePortFinder';
import path from 'path';
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
      const basePath = path
        .join(__dirname, '../../resources')
        .replace('app.asar', 'app.asar.unpacked'); // process.resourcesPath;
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
          -alwaysUpdate
              всегда искать устройства и обновлять их список, даже когда ни один клиент не подключён (в основном требуется для тестирования)
      */
      var flasherArgs: string[] = [
        '-updateList=1',
        '-listCooldown=0',
        `-address=${FLASHER_LOCAL_HOST}:${FLASHER_LOCAL_PORT}`,
      ];
      let modulePath: string = '';
      switch (platform) {
        case 'linux':
          modulePath = `${basePath}/modules/${platform}/${module}`;
          break;
        case 'win32':
          modulePath = `${basePath}/modules/${platform}/${module}.exe`;
          break;
        default:
          console.log(`Платформа ${platform} не поддерживается (:^( )`);
      }
      if (modulePath) {
        console.log(modulePath);
        chprocess = spawn(modulePath, flasherArgs);
        chprocess.on('error', function (err) {
          // FIXME: выводить ошибку в интерфейсе
          console.error(`${module} spawn error: ` + err);
        });
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
