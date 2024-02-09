import { Dispatch, SetStateAction } from 'react';

import { base64StringToBlob } from 'blob-util';
import Websocket from 'isomorphic-ws';

import { Buffer } from 'buffer';

import {
  CompilerSettings,
  CompilerResult,
  Binary,
  SourceFile,
} from '@renderer/types/CompilerTypes';
import { Elements } from '@renderer/types/diagram';

export class Compiler {
  static port = 8081;
  static host = 'localhost';
  static base_address = `ws://${this.host}:${this.port}/`;
  static connection: Websocket | undefined;
  static connecting: boolean = false;
  static setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>;
  // Статус подключения.
  static setCompilerStatus: Dispatch<SetStateAction<string>>;
  static setCompilerMode: Dispatch<SetStateAction<string>>;
  static setImportData: Dispatch<SetStateAction<string | undefined>>;
  static mode: string;

  static timerOutID: NodeJS.Timeout;
  //Если за данное время не пришел ответ от компилятора
  //мы считаем, что произошла ошибка.
  static timeOutTime = 100000;
  static timeoutSetted = false;
  private static timerReconnectID: NodeJS.Timeout;
  // начальное время для timeout
  private static startTimeout: number = 2000;
  // текущее количество мс, через которое произойдёт повторная попытка подключения (в случае, если не удалось подключиться)
  private static timeout: number = this.startTimeout;
  // количество совершённых попыток переподключения, сбрасывается при удачном подключении
  private static curReconnectAttemps: number = 1;
  /*  
    максимальное количество автоматических попыток переподключения
    значение меньше нуля означает, что ограничение на попытки отсутствует
  */
  private static maxReconnectAttempts: number = 3;
  // true = пробовать переподключиться
  private static shouldReconnect: boolean = true;
  static filename: string;

  static setDefaultStatus() {
    this.setCompilerStatus('Не подключен');
    this.setCompilerData(undefined);
  }

  static bindReact(
    setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>,
    setCompilerStatus: Dispatch<SetStateAction<string>>,
    setImportData: Dispatch<SetStateAction<string | undefined>>
  ): void {
    this.setCompilerData = setCompilerData;
    this.setCompilerStatus = setCompilerStatus;
    this.setImportData = setImportData;
  }

  static binary: Array<Binary> | undefined = undefined;
  static source: Array<SourceFile> | undefined = undefined;
  // платформа на которой произвелась последняя компиляция;
  static platform: string | undefined = undefined;

  static checkConnection(connection: Websocket | undefined): connection is Websocket {
    return connection !== undefined;
  }

  static decodeBinaries(binaries: Array<any>) {
    binaries.map((binary) => {
      console.log(base64StringToBlob(binary.fileContent!));
      console.log(binary.filename, binary.extension);
      this.binary?.push({
        filename: binary.filename,
        extension: binary.extension,
        fileContent: base64StringToBlob(binary.fileContent!),
      } as Binary);
    });
  }

  static async prepareToSave(binaries: Array<Binary>): Promise<Array<Binary>> {
    const newArray = Object.assign([], binaries) as Binary[];
    for (const bin of newArray) {
      const blob = new Blob([bin.fileContent as Uint8Array]);
      bin.fileContent = Buffer.from(await blob.arrayBuffer());
    }

    return newArray;
  }

  static getSourceFiles(sources: Array<any>): Array<SourceFile> {
    const result = new Array<SourceFile>();
    sources.map((source) => {
      result.push({
        filename: source.filename,
        extension: source.extension,
        fileContent: source.fileContent,
      } as SourceFile);
    });

    return result;
  }

  // Устанавливает новое соединение, закрывая старое. Ничего не делает, если заданный адрес совпадает с текущим и соединение установлено или устанавливается.
  static async connect(host: string, port: number, timeout = this.startTimeout) {
    if (
      this.host == host &&
      this.port == port &&
      (this.connecting || this.checkConnection(this.connection))
    ) {
      return;
    }
    this.timeout = timeout;
    this.host = host;
    this.port = port;
    this.base_address = `ws://${this.host}:${this.port}/main`;
    await Compiler.close();
    await Compiler.connectRoute(this.base_address);
  }

  static async close() {
    this.shouldReconnect = false;
    await this.connection?.close();
    clearTimeout(this.timerReconnectID);
    this.timeoutSetted = false;
    this.connection = undefined;
    //console.log('DISCONNECTED');
  }

  static reconnect() {
    this.connectRoute(this.base_address);
  }

  static async connectRoute(route: string): Promise<Websocket | undefined> {
    if (this.checkConnection(this.connection)) return this.connection;
    if (this.connecting) return;
    //console.log('CONNECTING');
    clearTimeout(this.timerReconnectID);
    this.timeoutSetted = false;
    this.setCompilerStatus('Идет подключение...');
    // FIXME: подключение к несуществующему узлу мгновенно кидает неотлавливаемую
    //   асинхронную ошибку, и никто с этим ничего не может сделать.
    console.log('CONNECTING TO', route);
    this.connection = new Websocket(route);
    this.connecting = true;

    this.connection.onopen = () => {
      console.log('Compiler: connected');
      this.setCompilerStatus('Подключен');
      this.connecting = false;
      this.timeoutSetted = false;
      this.timeout = this.startTimeout;
      this.curReconnectAttemps = 0;
      this.shouldReconnect = true;
    };

    this.connection.onmessage = (msg) => {
      // console.log(msg);
      this.setCompilerStatus('Подключен');
      clearTimeout(this.timerOutID);
      let data;
      switch (this.mode) {
        case 'compile':
          data = JSON.parse(msg.data as string);
          if (data.binary.length > 0) {
            this.binary = [];
            this.decodeBinaries(data.binary);
          } else {
            this.binary = undefined;
          }
          this.setCompilerData({
            result: data.result,
            stdout: data.stdout,
            stderr: data.stderr,
            binary: this.binary,
            source: this.getSourceFiles(data.source),
            platform: this.platform,
          } as CompilerResult);
          break;
        case 'import':
          data = JSON.parse(msg.data as string);
          console.log(data);
          // TODO: Сразу распарсить как Elements.
          this.setImportData(JSON.stringify(data.source[0].fileContent));
          break;
        case 'export':
          data = JSON.parse(msg.data as string) as SourceFile;
          this.setCompilerData({
            result: 'OK',
            binary: [],
            //В данный момент название файла, которое приходит от компилятора
            //Выглядит так: Robot_время.
            source: [
              {
                filename: data.filename,
                extension: data.extension,
                fileContent: data.fileContent,
              },
            ],
          });
          break;
        default:
          break;
      }
    };

    this.connection.onclose = async () => {
      if (this.connection) {
        console.log('Compiler: connection closed');
      }
      this.setCompilerStatus('Не подключен');
      this.connection = undefined;
      this.connecting = false;
      if (
        this.shouldReconnect &&
        !this.timeoutSetted &&
        (this.maxReconnectAttempts < 0 || this.curReconnectAttemps < this.maxReconnectAttempts)
      ) {
        this.timeoutSetted = true;
        this.timerReconnectID = setTimeout(() => {
          console.log(`Compiler: retry in ${this.timeout} ms`);
          if (this.timeout < 16000) {
            this.timeout += 2000;
          }
          this.curReconnectAttemps++;
          this.reconnect();
          this.timeoutSetted = false;
        }, this.timeout);
      }
    };

    return this.connection;
  }

  static async compile(platform: string, data: Elements | string) {
    this.platform = platform;
    const route = this.base_address;
    const ws: Websocket | undefined = await this.connectRoute(route);
    if (ws !== undefined) {
      const [mainPlatform, subPlatform] = platform.split('-');
      console.log(mainPlatform, subPlatform);
      switch (mainPlatform) {
        case 'ArduinoUno': {
          ws.send('arduino');
          this.mode = 'compile';
          const compilerSettings: CompilerSettings = {
            compiler: 'arduino-cli',
            filename: this.filename,
            flags: ['-b', 'arduino:avr:uno'],
          };
          const obj = {
            ...(data as Elements),
            compilerSettings: compilerSettings,
          };
          ws.send(JSON.stringify(obj));
          break;
        }
        case 'ArduinoMicro': {
          ws.send('arduino');
          this.mode = 'compile';
          const compilerSettings: CompilerSettings = {
            compiler: 'arduino-cli',
            filename: this.filename,
            flags: ['-b', 'arduino:avr:micro'],
          };
          const obj = {
            ...(data as Elements),
            compilerSettings: compilerSettings,
          };
          ws.send(JSON.stringify(obj));
          break;
        }
        case 'BearlogaDefendImport':
          ws.send('berlogaImport');
          ws.send(data as string);
          ws.send(subPlatform);
          console.log('import!');
          this.mode = 'import';
          break;
        case 'BearlogaDefend':
          ws.send('berlogaExport');
          ws.send(JSON.stringify(data));
          if (subPlatform !== undefined) {
            ws.send(subPlatform);
          } else {
            ws.send('Robot');
          }
          console.log('export!');
          this.mode = 'export';
          break;
        default:
          console.log(`unknown platform ${platform}`);
          return;
      }

      this.setCompilerStatus('Идет компиляция...');
      this.timerOutID = setTimeout(() => {
        Compiler.setCompilerStatus('Что-то пошло не так...');
      }, this.timeOutTime);
    } else {
      console.log('Внутренняя ошибка! Отсутствует подключение');
    }
  }
}
