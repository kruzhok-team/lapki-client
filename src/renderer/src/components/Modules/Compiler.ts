import { Dispatch, SetStateAction } from 'react';

import { base64StringToBlob } from 'blob-util';
import Websocket from 'isomorphic-ws';
import { toast } from 'sonner';

import { Buffer } from 'buffer';

import { exportCGML } from '@renderer/lib/data/GraphmlBuilder';
import { generateId } from '@renderer/lib/utils';
import {
  CompilerResult,
  Binary,
  SourceFile,
  CompilerTransition,
  CompilerInitialState,
  CompilerElements,
  CompilerState,
  CompilerComponent,
} from '@renderer/types/CompilerTypes';
import { Component, Elements, InitialState, State, Transition } from '@renderer/types/diagram';

import { CompilerStatus, CompilerNoDataStatus } from './Websocket/ClientStatus';
import { ClientWS } from './Websocket/ClientWS';
import { ComplierTimeoutTimer } from './Websocket/ReconnectTimer';

function actualizeTransitions(oldTransitions: { [key: string]: CompilerTransition }): {
  [key: string]: Transition;
} {
  const newTransitions: {
    [key: string]: Transition;
  } = {};
  for (const transitionId in oldTransitions) {
    const oldTransition = oldTransitions[transitionId];
    newTransitions[transitionId] = {
      sourceId: oldTransition.source,
      targetId: oldTransition.target,
      color: oldTransition.color,
      label: {
        trigger: oldTransition.trigger,
        position: oldTransition.position,
        condition: oldTransition.condition,
        do: oldTransition.do,
      },
    };
  }
  return newTransitions;
}

function actualizeStates(oldStates: { [id: string]: CompilerState }): { [id: string]: State } {
  const states: { [id: string]: State } = {};
  for (const oldStateId in oldStates) {
    const oldState = oldStates[oldStateId];
    states[oldStateId] = {
      dimensions: {
        width: oldState.bounds.width,
        height: oldState.bounds.height,
      },
      position: {
        x: oldState.bounds.x,
        y: oldState.bounds.y,
      },
      name: oldState.name,
      parentId: oldState.parent,
      events: oldState.events,
    };
  }
  return states;
}

function actualizeInitialState(
  oldInitial: CompilerInitialState
): [{ [id: string]: InitialState }, { [id: string]: Transition }] {
  const initialId = generateId();
  const transitionId = generateId();
  const transition: Transition = {
    sourceId: initialId,
    targetId: oldInitial.target,
  };
  const initial: InitialState = {
    position: oldInitial.position,
    dimensions: { width: 50, height: 50 },
  };
  return [{ [initialId]: initial }, { [transitionId]: transition }];
}

function actualizeComponents(oldComponents: { [id: string]: CompilerComponent }): {
  [id: string]: Component;
} {
  const components: {
    [id: string]: Component;
  } = {};
  let orderComponent = 0;
  for (const oldComponentId in oldComponents) {
    const oldComponent = oldComponents[oldComponentId];
    components[oldComponentId] = {
      ...oldComponent,
      order: orderComponent,
    };
    orderComponent += 1;
  }

  return components;
}

function actualizeElements(oldElements: CompilerElements): Elements {
  const [initials, initialTransition] = actualizeInitialState(oldElements.initialState);
  return {
    parameters: oldElements.parameters,
    stateMachines: {
      G: {
        visual: true,
        position: { x: 0, y: 0 },
        platform: oldElements.platform,
        components: actualizeComponents(oldElements.components),
        states: actualizeStates(oldElements.states),
        finalStates: {},
        choiceStates: {},
        notes: {},
        transitions: {
          ...actualizeTransitions(oldElements.transitions),
          ...initialTransition,
        },
        initialStates: initials,
        meta: {},
      },
    },
  };
}

export class Compiler extends ClientWS {
  static setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>;
  static setCompilerMode: Dispatch<SetStateAction<string>>;
  static setImportData: Dispatch<SetStateAction<Elements | undefined>>;
  static setCompilerNoDataStatus: Dispatch<SetStateAction<string>>;
  static mode: string;

  static filename: string;

  static timeoutTimer = new ComplierTimeoutTimer();

  static setDefaultStatus() {
    this.onStatusChange(CompilerStatus.NO_CONNECTION);
    this.setCompilerData(undefined);
  }

  static bindReact(
    setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>,
    setCompilerStatus: Dispatch<SetStateAction<string>>,
    setImportData: Dispatch<SetStateAction<Elements | undefined>>,
    setCompilerNoDataStatus: Dispatch<SetStateAction<string>>,
    setSecondsUntilReconnect: Dispatch<SetStateAction<number | null>>
  ): void {
    super.bind(setCompilerStatus, setSecondsUntilReconnect);
    this.setCompilerData = setCompilerData;
    this.setImportData = setImportData;
    this.setCompilerNoDataStatus = setCompilerNoDataStatus;
  }

  static binary: Array<Binary> | undefined = undefined;
  static source: Array<SourceFile> | undefined = undefined;
  // платформа на которой произвелась последняя компиляция;
  static platform: string | undefined = undefined;

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

  static async compile(data: Elements | string) {
    this.setCompilerData(undefined);
    this.setCompilerNoDataStatus(CompilerNoDataStatus.DEFAULT);
    await this.connect(this.host, this.port).then((ws: Websocket | undefined) => {
      if (ws !== undefined) {
        // TODO (L140-beep): Понять, что с этим делать
        // switch (mainPlatform) {
        //   case 'BearlogaDefendImport':
        //     ws.send('berlogaImport');
        //     ws.send(data as string);
        //     ws.send(subPlatform);
        //     this.mode = 'import';
        //     break;
        //   case 'BearlogaDefend':
        //     ws.send('berlogaExport');
        //     ws.send(JSON.stringify(data));
        //     if (subPlatform !== undefined) {
        //       ws.send(subPlatform);
        //     } else {
        //       ws.send('Robot');
        //     }
        //     this.mode = 'export';
        //     break;
        //   default:
        ws.send('cgml');
        this.mode = 'compile';
        ws.send(exportCGML(data as Elements));
        // break;
        // }

        this.onStatusChange(CompilerStatus.COMPILATION);
        this.timeoutTimer.timeOut(() => {
          toast.error(CompilerNoDataStatus.TIMEOUT);
          this.setCompilerNoDataStatus(CompilerNoDataStatus.TIMEOUT);
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
    let data;
    let elements;
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
          commands: data.commands,
          binary: this.binary,
          source: this.getSourceFiles(data.source),
          platform: this.platform,
        } as CompilerResult);
        break;
      case 'import':
        data = JSON.parse(msg.data as string) as CompilerElements;
        elements = actualizeElements(data.source[0].fileContent);
        this.setImportData(elements);
        break;
      case 'export':
        data = JSON.parse(msg.data as string) as SourceFile;
        this.setCompilerData({
          result: 'OK',
          commands: [],
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
  }

  static closeHandler(host: string, port: number, event: Websocket.CloseEvent) {
    this.timeoutTimer.clear();
    this.setCompilerNoDataStatus(CompilerNoDataStatus.DEFAULT);
    if (!event.wasClean) {
      toast.error('Ошибка при подключении к компилятору');
    }
    super.closeHandler(host, port, event);
  }

  static makeAddress(host: string, port: number): string {
    return `${super.makeAddress(host, port)}/main`;
  }

  static onOpenHandler(): void {
    this.setCompilerNoDataStatus(CompilerNoDataStatus.DEFAULT);
    super.onOpenHandler();
  }
}
