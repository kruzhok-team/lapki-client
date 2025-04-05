import { Dispatch, SetStateAction } from 'react';

import { base64StringToBlob } from 'blob-util';
import Websocket from 'isomorphic-ws';
import { toast } from 'sonner';

import { Buffer } from 'buffer';

import { exportCGML } from '@renderer/lib/data/GraphmlBuilder';
import { CompilerResult, Binary, SourceFile, CompilerRequest } from '@renderer/types/CompilerTypes';
import { Elements, StateMachine } from '@renderer/types/diagram';

import { actualizeElements } from './ActualizeResponse';
import { downgradeStateMachine } from './DowngradeResponse';
import { CompilerStatus, CompilerNoDataStatus } from './Websocket/ClientStatus';
import { ClientWS } from './Websocket/ClientWS';
import { ComplierTimeoutTimer } from './Websocket/ReconnectTimer';

export class Compiler extends ClientWS {
  static setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>;
  static setCompilerMode: Dispatch<SetStateAction<string>>;
  static setImportData: Dispatch<SetStateAction<Elements | undefined>>;
  static mode: string;
  static filename: string;

  static bearlogaSmId: string = 'G';

  static timeoutTimer = new ComplierTimeoutTimer();

  static setDefaultStatus() {
    this.onStatusChange(CompilerStatus.NO_CONNECTION);
    this.setCompilerData(undefined);
  }

  static bindReact(
    setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>,
    setCompilerStatus: Dispatch<SetStateAction<string>>,
    setImportData: Dispatch<SetStateAction<Elements | undefined>>,
    setSecondsUntilReconnect: Dispatch<SetStateAction<number | null>>
  ): void {
    super.bind(setCompilerStatus, setSecondsUntilReconnect);
    this.setCompilerData = setCompilerData;
    this.setImportData = setImportData;
  }

  static binary: { [id: string]: Binary[] } = {}; // id машины состояний - бинарники
  static source: { [id: string]: SourceFile[] } = {}; // id машины состояний - файлы
  // платформа на которой произвелась последняя компиляция;
  static platform: string | undefined = undefined;

  static decodeBinaries(binaries: Array<any>) {
    const decodedBinaries: Binary[] = [];
    binaries.map((binary) => {
      // console.log(base64StringToBlob(binary.fileContent!));
      // console.log(binary.filename, binary.extension);
      decodedBinaries.push({
        filename: binary.filename,
        extension: binary.extension,
        fileContent: base64StringToBlob(binary.fileContent!),
      } as Binary);
    });

    return decodedBinaries;
  }

  static async prepareToSave(binaries: Array<Binary>): Promise<Array<Binary>> {
    const newArray = Object.assign([], binaries) as Binary[];
    for (const bin of newArray) {
      const blob = new Blob([bin.fileContent as unknown as Uint8Array]);
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

  static async compile(
    data: Elements | string | StateMachine,
    mode: 'BearlogaImport' | 'BearlogaExport' | 'CGML',
    subPlatform?: string,
    bearlogaSmId?: string
  ) {
    this.setCompilerData(undefined);
    await this.connect(this.host, this.port).then((ws: Websocket | undefined) => {
      if (ws !== undefined) {
        // TODO (L140-beep): Понять, что с этим делать
        switch (mode) {
          case 'BearlogaImport':
            ws.send('berlogaImport');
            ws.send(data as string);
            ws.send(subPlatform ?? 'Robot');
            this.mode = 'import';
            break;
          case 'BearlogaExport':
            ws.send('berlogaExport');
            this.bearlogaSmId = bearlogaSmId!;
            ws.send(JSON.stringify(downgradeStateMachine(data as StateMachine)));
            ws.send(subPlatform ?? 'Robot');
            this.mode = 'export';
            break;
          case 'CGML':
            ws.send('cgml');
            this.mode = 'compile';
            ws.send(exportCGML(data as Elements));
            break;
        }

        this.onStatusChange(CompilerStatus.COMPILATION);
        this.timeoutTimer.timeOut(() => {
          toast.error(CompilerNoDataStatus.TIMEOUT);
          // возращаем статут соединения, если соединение присутствует
          // если оно пропало, то статус изменится самостоятельно, то есть тут ничего менять не надо
          if (this.connection && this.connection.OPEN) {
            this.onStatusChange(CompilerStatus.CONNECTED);
          }
        });
      } else {
        console.error('Внутренняя ошибка! Отсутствует подключение');
      }
    });
  }

  // обработка входящих через вебсоект сообщений
  static messageHandler(msg: Websocket.MessageEvent) {
    this.onStatusChange(CompilerStatus.CONNECTED);
    this.timeoutTimer.clear();
    let data: CompilerRequest;
    let elements: Elements;
    let compilerElements: { source: any[] }; // импорт берлоги
    let exportRequest: SourceFile;
    const compilerResult: CompilerResult = {
      result: 'OK',
      state_machines: {},
    };
    switch (this.mode) {
      case 'compile':
        data = JSON.parse(msg.data as string) as CompilerRequest;
        compilerResult.result = data.result;
        for (const stateMachineId in data.state_machines) {
          const sm = data.state_machines[stateMachineId];
          compilerResult.state_machines[stateMachineId] = sm;
          const decodedBinaries = this.decodeBinaries(sm.binary);
          this.binary[stateMachineId] = decodedBinaries;
          this.source[stateMachineId] = sm.source;
          compilerResult.state_machines[stateMachineId].binary = decodedBinaries;
        }
        this.setCompilerData(compilerResult);
        break;
      case 'import':
        compilerElements = JSON.parse(msg.data as string);
        elements = actualizeElements(compilerElements.source[0].fileContent);
        this.setImportData(elements);
        break;
      case 'export':
        exportRequest = JSON.parse(msg.data as string) as SourceFile;
        this.setCompilerData({
          result: 'OK',
          state_machines: {
            [this.bearlogaSmId]: {
              result: 'OK',
              name: this.bearlogaSmId,
              commands: [],
              binary: [],
              //В данный момент название файла, которое приходит от компилятора
              //Выглядит так: Robot_время.
              source: [
                {
                  filename: exportRequest.filename,
                  extension: exportRequest.extension,
                  fileContent: exportRequest.fileContent,
                },
              ],
            },
          },
        });
        break;
      default:
        break;
    }
  }

  static closeHandler(host: string, port: number, event: Websocket.CloseEvent) {
    this.timeoutTimer.clear();
    if (!event.wasClean) {
      toast.error('Ошибка при подключении к компилятору');
    }
    super.closeHandler(host, port, event);
  }

  static makeAddress(host: string, port: number): string {
    return `${super.makeAddress(host, port)}/main`;
  }

  static onOpenHandler(): void {
    super.onOpenHandler();
  }
}
