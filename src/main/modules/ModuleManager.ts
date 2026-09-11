import { app } from 'electron';
import settings from 'electron-settings';
// импорт старой версии (3.0 вместо 4.0), так как новая версия требует ESM
import fixPath from 'fix-path';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync } from 'fs';
import { cp, mkdir, readFile } from 'fs/promises';
import http from 'http';
import path from 'path';

import { findFreePort, getUsedPorts } from './freePortFinder';
import { terminateProcessTree } from './processTree';

import { defaultSettings } from '../settings';
import { basePath } from '../utils';
export type ModuleName = 'lapki-flasher' | 'lapki-compiler' | 'sm-interpreter';

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
  static stoppingModules: Map<string, Promise<void>> = new Map();
  static async startLocalModule(module: ModuleName) {
    const usedPorts = getUsedPorts();
    this.moduleStatus.set(module, new ModuleStatus());
    if (!this.localProccesses.has(module)) {
      const platform = process.platform;
      let chprocess;
      let modulePath: string = '';
      // При запуске из ярлыка под Linux или в MacOS PATH можем быть урезанным.
      // Восстановим его, чтобы получить доступ к установленному в системе компилятору.
      if (platform === 'darwin' || platform === 'linux') {
        fixPath();
      }
      switch (platform) {
        case 'darwin':
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
            const port = await findFreePort({ usedPorts });
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
              `-blgMbUploaderPath=${this.getBlgMbUploaderPath()}`, // путь к загрузчику КиберМишки
              `-deviceListPath=${this.getDeviceListPath()}`,
            ];

            const avrdudePath = this.getAvrdudePath();
            const configPath = this.getConfPath();
            console.log('flasher port: ', port);
            console.log('pathes', avrdudePath, configPath);
            if (existsSync(avrdudePath)) {
              flasherArgs.push(`-avrdudePath=${avrdudePath}`);
            }
            if (existsSync(configPath)) {
              flasherArgs.push(`-configPath=${configPath}`);
            }
            chprocess = spawn(modulePath, flasherArgs, {
              env: this.getFlasherEnvironment(),
            });
            break;
          }
          case 'lapki-compiler': {
            const port = await findFreePort({ usedPorts });
            this.prepareCompilerToolchainPath();
            await this.prepareArduinoCliData();
            const compilerUserDataPath = path.join(app.getPath('userData'), 'lapki-compiler');
            await mkdir(compilerUserDataPath, { recursive: true });
            const compilerArgs = [
              `--server-port=${port}`,
              '--killable',
              `--library-path=${this.getCompilerDataPath('library')}`,
              `--platform-directory=${this.getCompilerDataPath('platforms')}`,
              `--build-directory=${path.join(compilerUserDataPath, 'build')}`,
              `--artifacts-directory=${path.join(compilerUserDataPath, 'artifacts')}`,
              `--log-path=${path.join(compilerUserDataPath, 'logs.log')}`,
              `--access-token-path=${path.join(compilerUserDataPath, 'ACCESS_TOKENS.txt')}`,
            ];
            switch (platform) {
              case 'win32':
              case 'linux':
                modulePath = this.getCompilerPath();
                await settings.set('compiler.localPort', port);
                defaultSettings.compiler.localPort = Number(port);
                chprocess = spawn(modulePath, compilerArgs);
                break;
              default:
                await settings.set('compiler.type', 'remote');
                console.log(
                  `К сожалению, локальный компилятор не поддерживается на данной платформе (${platform}).`
                );
            }
            break;
          }
          case 'sm-interpreter': {
            const port = await findFreePort({ usedPorts });
            await settings.set('interpreter.localPort', port);
            defaultSettings.interpreter.localPort = Number(port);
            chprocess = spawn(modulePath, [`--host=127.0.0.1`, `--port=${port}`]);
            break;
          }
          default:
            chprocess = spawn(modulePath);
        }
      }
      if (chprocess !== undefined) {
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

  private static async sendKillRequest(port: number): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const req = http.get(`http://localhost:${port}/kill`, (res) => {
        res.resume();
        res.on('end', finish);
        res.on('error', finish);
      });
      req.on('error', (err) => {
        // Ignore errors since we're shutting down anyway
        console.log(err);
        finish();
      });
      req.setTimeout(1_000, () => {
        req.destroy();
        finish();
      });
    });
  }

  static async stopModule(module: ModuleName): Promise<void> {
    const pendingStop = this.stoppingModules.get(module);
    if (pendingStop) return pendingStop;

    const child = this.localProccesses.get(module);
    if (!child) return;

    const stop = (async () => {
      if (module === 'lapki-compiler') {
        const port = Number(await settings.get('compiler.localPort'));
        await this.sendKillRequest(port);
      }

      await terminateProcessTree(child);

      if (this.localProccesses.get(module) === child) {
        this.localProccesses.delete(module);
      }
    })();

    this.stoppingModules.set(module, stop);
    try {
      await stop;
    } finally {
      this.stoppingModules.delete(module);
    }
  }

  static async stopAllModules(): Promise<void> {
    await Promise.all(
      (['lapki-flasher', 'lapki-compiler', 'sm-interpreter'] as const).map((module) =>
        this.stopModule(module)
      )
    );
  }

  static getLocalStatus(module: ModuleName): ModuleStatus {
    return this.moduleStatus.get(module)!;
  }

  static getOsPath(): string {
    return `${basePath}/modules/${process.platform}`;
  }

  static getOsExe(executable: string): string {
    if (process.platform === 'win32') {
      return `${executable}.exe`;
    }
    return executable;
  }

  static getAvrdudePath(): string {
    return this.getModulePath('avrdude');
  }

  static getCompilerPath() {
    return this.getModulePath('lapki-compiler/lapki-compiler');
  }

  /** Add bundled compiler tools to this process only; never alter user PATH. */
  private static prepareCompilerToolchainPath(): void {
    let toolchainDirectories: string[];
    if (process.platform === 'linux') {
      const toolchainRoot = path.join(basePath, 'toolchains', 'linux');
      toolchainDirectories = [
        path.join(toolchainRoot, 'arduino-cli'),
        path.join(toolchainRoot, 'gcc-arm-none-eabi', 'bin'),
        path.join(toolchainRoot, 'make'),
      ];
    } else if (process.platform === 'win32') {
      const moduleRoot = this.getOsPath();
      toolchainDirectories = [
        path.join(moduleRoot, 'gcc-arm-none-eabi', 'bin'),
        path.join(moduleRoot, 'arduino-cli'),
        path.join(moduleRoot, 'irpcb', 'bin'),
      ];
    } else {
      return;
    }

    const currentPath = process.env.PATH ?? '';
    const pathEntries = currentPath.split(path.delimiter);
    const availableDirectories = toolchainDirectories.filter(existsSync);
    const missingDirectories = availableDirectories.filter(
      (directory) => !pathEntries.includes(directory)
    );
    if (missingDirectories.length > 0) {
      process.env.PATH = `${missingDirectories.join(path.delimiter)}${path.delimiter}${currentPath}`;
    }
  }

  /**
   * Arduino AVR core is bundled per host platform, then copied once into a
   * writable user directory. Arduino CLI stores indexes and caches alongside
   * installed platforms, so its packaged resource directory cannot be used
   * directly.
   */
  private static async prepareArduinoCliData(): Promise<void> {
    const bundledDataPath = path.join(basePath, 'arduino-cli-data', process.platform);
    const markerName = '.lapki-arduino-avr-core-version';
    const bundledMarkerPath = path.join(bundledDataPath, markerName);

    if (process.platform === 'win32') {
      const arduinoCliDirectory = path.join(this.getOsPath(), 'arduino-cli');
      const arduinoCliPath = path.join(arduinoCliDirectory, 'arduino-cli.exe');
      if (existsSync(arduinoCliPath)) {
        const currentPath = process.env.PATH ?? '';
        if (!currentPath.split(path.delimiter).includes(arduinoCliDirectory)) {
          process.env.PATH = `${arduinoCliDirectory}${path.delimiter}${currentPath}`;
        }
      }
    }

    if (!existsSync(bundledMarkerPath)) return;

    const coreVersion = (await readFile(bundledMarkerPath, 'utf8')).trim();
    if (!coreVersion) return;

    const localCoreDirectory = coreVersion.replace(/[^a-zA-Z0-9._-]/g, '_');
    const localDataPath = path.join(app.getPath('userData'), 'arduino-cli', localCoreDirectory);
    const localMarkerPath = path.join(localDataPath, markerName);
    if (!existsSync(localMarkerPath)) {
      // Arduino AVR GCC uses relative symlinks for its LTO plugin. Preserve
      // them verbatim: resolving them here would point user data at the
      // temporary AppImage mount (or a particular DEB installation path).
      await cp(bundledDataPath, localDataPath, {
        recursive: true,
        force: true,
        verbatimSymlinks: true,
      });
    }

    process.env.ARDUINO_DIRECTORIES_DATA = localDataPath;

  }

  /**
   * Snap cannot load arbitrary host libraries.  libusb is shipped beside the
   * Linux modules, but must not replace the host library lookup for unrelated
   * child processes such as the compiler.
   */
  private static getFlasherEnvironment(): NodeJS.ProcessEnv {
    if (process.platform !== 'linux') return process.env;

    // A DEB uses the distribution's libusb declared in its dependencies.
    // Only self-contained launchers need the bundled copy.
    if (!process.env.APPIMAGE && !process.env.SNAP) return process.env;

    const bundledLibraryPath = path.join(this.getOsPath(), 'lib');
    if (!existsSync(bundledLibraryPath)) return process.env;

    const currentLibraryPath = process.env.LD_LIBRARY_PATH;
    return {
      ...process.env,
      LD_LIBRARY_PATH: currentLibraryPath
        ? `${bundledLibraryPath}${path.delimiter}${currentLibraryPath}`
        : bundledLibraryPath,
    };
  }

  /**
   * Compiler data is bundled once next to the executable.  Keeping the paths
   * explicit lets a frozen one-file compiler use the packaged assets instead
   * of its temporary extraction directory.
   */
  static getCompilerDataPath(directory: 'library' | 'platforms'): string {
    return `${this.getOsPath()}/lapki-compiler/${directory}`;
  }

  static getConfPath(): string {
    return `${this.getOsPath()}/avrdude.conf`;
  }

  static getBlgMbUploaderPath(): string {
    return this.getModulePath('blg-mb/cyberbear-loader');
  }

  static getModulePath(module: string): string {
    return this.getOsExe(`${this.getOsPath()}/${module}`);
  }

  static getDeviceListPath(): string {
    return `${basePath}/flasher/device_list.JSON`;
  }
}
