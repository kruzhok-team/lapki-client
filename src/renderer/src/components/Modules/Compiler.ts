import Websocket from 'isomorphic-ws';
import { Dispatch, SetStateAction } from 'react';
import { base64StringToBlob } from 'blob-util';
import { Buffer } from 'buffer';
import { Elements } from '@renderer/types/diagram';
import {
  CompilerSettings,
  CompilerResult,
  Binary,
  SourceFile,
} from '@renderer/types/CompilerTypes';

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

  static timerID: NodeJS.Timeout;
  //Если за данное время не пришел ответ от компилятора
  //мы считаем, что произошла ошибка.
  static timeOutTime = 100000;
  static timeoutSetted = false;

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

  static checkConnection(): boolean {
    return this.connection !== undefined;
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
      bin.fileContent = Buffer.from(await (bin.fileContent as Blob).arrayBuffer());
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

  static connect(route: string, timeout: number = 0): Websocket {
    if (this.checkConnection()) return this.connection!;
    if (this.connecting) return;
    this.setCompilerStatus('Идет подключение...');
    const ws = new WebSocket(route);
    this.connecting = true;

    ws.onopen = () => {
      console.log('Compiler: connected');
      this.setCompilerStatus('Подключен');
      this.connection = ws;
      this.connecting = false;
      this.timeoutSetted = false;
      timeout = 0;
    };

    ws.onmessage = (msg) => {
      // console.log(msg);
      const data = JSON.parse(msg.data);
      console.log(data);
      this.setCompilerStatus('Подключен');
      switch (this.mode) {
        case 'compile':
          console.log(msg.data);
          console.log(typeof data);
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
          } as CompilerResult);
          break;
        case 'import':
          // TODO: Сразу распарсить как Elements.
          this.setImportData(JSON.stringify(data.source[0].fileContent));
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      console.log('closed');
      this.setCompilerStatus('Не подключен');
      this.connection = undefined;
      this.connecting = false;
      if (!this.timeoutSetted) {
        this.timeoutSetted = true;
        timeout += 2000;
        setTimeout(() => {
          console.log(timeout);
          this.connect(route, timeout);
          this.timeoutSetted = false;
        }, timeout);
      }
    };

    return ws;
  }

  static compile(platform: string, data: Elements | string) {
    const route = `${this.base_address}main`;
    const ws: Websocket = this.connect(route);
    let compilerSettings: CompilerSettings;
    console.log(platform);
    switch (platform) {
      case 'ArduinoUno':
        ws.send('arduino');
        this.mode = 'compile';
        compilerSettings = {
          compiler: 'arduino-cli',
          filename: 'biba',
          flags: ['-b', 'arduino:avr:uno'],
        };
        const obj = {
          ...(data as Elements),
          compilerSettings: compilerSettings,
        };
        ws.send(JSON.stringify(obj));
        break;
      case 'BearlogaDefendImport':
        ws.send('berlogaImport');
        ws.send(data);
        console.log('import!');
        this.mode = 'import';
        break;
      default:
        console.log('unknown platform');
        return;
    }

    this.setCompilerStatus('Идет компиляция...');
    this.timerID = setTimeout(() => {
      Compiler.setCompilerStatus('Что-то пошло не так...');
    }, this.timeOutTime);
  }
}
