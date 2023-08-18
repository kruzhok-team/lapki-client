import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
// import { Flasher } from '../../renderer/src/components/Modules/Flasher';

export class ModuleManager {
  static localProccesses: Map<string, ChildProcessWithoutNullStreams> = new Map();

  static startLocalModule(module: string) {
    if (!this.localProccesses.has(module)) {
      const platform = process.platform;
      var chprocess;
      switch (platform) {
        case 'linux':
          chprocess = spawn(`./src/main/modules/src/${platform}/${module}`);
          break;
        case 'win32':
          chprocess = spawn(`src/main/modules/src/${platform}/${module}.exe`);
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
