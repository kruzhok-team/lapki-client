import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
// import { Flasher } from '../../renderer/src/components/Modules/Flasher';

export class ModuleManager {
  static localProccesses: Map<string, ChildProcessWithoutNullStreams> = new Map();

  static startLocalModule(module: string) {
    if (!this.localProccesses.has(module)) {
      const platform = process.platform;
      switch (platform) {
        case 'linux':
          const chprocess = spawn(`./src/main/modules/src/${platform}/${module}`);
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
          break;
        case 'win32':
          console.log('biba boba');
          break;
        default:
          console.log(`Платформа ${platform} не поддерживается (:^( )`);
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
