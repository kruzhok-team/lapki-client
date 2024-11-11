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
  CompilerRequest,
  CompilerAction,
} from '@renderer/types/CompilerTypes';
import {
  Action,
  Component,
  Condition,
  Elements,
  Event,
  InitialState,
  State,
  StateMachine,
  Transition,
} from '@renderer/types/diagram';

import { CompilerStatus, CompilerNoDataStatus } from './Websocket/ClientStatus';
import { ClientWS } from './Websocket/ClientWS';
import { ComplierTimeoutTimer } from './Websocket/ReconnectTimer';

function downgradeInitialState(
  transitions: { [id: string]: Transition },
  id: string,
  initialState: InitialState
): CompilerInitialState {
  const target = Object.values(transitions).find((transition) => transition.sourceId === id);
  if (!target) throw Error('Отсутствует переход из начального состояния!');
  return {
    target: target.targetId,
    position: initialState.position,
  };
}

function downgradeTransitions(transitions: { [id: string]: Transition }): CompilerTransition[] {
  const downgradedTransitions: CompilerTransition[] = [];

  for (const transition of Object.values(transitions)) {
    if (!transition.label || !transition.label.trigger) continue;
    downgradedTransitions.push({
      source: transition.sourceId,
      target: transition.targetId,
      color: transition.color ?? '#FFFFFF',
      // TODO: Переводить в объект Condition если у нас включен текстовый режим
      condition: (transition.label?.condition as Condition) ?? null,
      trigger: transition.label.trigger as Event,
      do: (transition.label.do as Action[]) ?? [],
      position: transition.label.position,
    });
  }
  return downgradedTransitions;
}

function downgradeStates(states: { [id: string]: State }): { [id: string]: CompilerState } {
  const downgradedStates: { [id: string]: CompilerState } = {};
  for (const stateId in states) {
    const state = states[stateId];
    downgradedStates[stateId] = {
      name: state.name,
      bounds: {
        ...state.dimensions,
        ...state.position,
      },
      events: state.events as CompilerAction[],
      parent: state.parentId,
    };
  }

  return downgradedStates;
}

// Даунгрейд МС до уровня Берлоги и старой версии компилятора
export function downgradeStateMachine(sm: StateMachine): CompilerElements {
  const initialState = Object.entries(sm.initialStates).find(
    (value) => value[1].parentId === undefined
  );
  if (!initialState) throw Error('Отсутствует начальное состояние!');
  const downgradedInitialState = downgradeInitialState(
    sm.transitions,
    initialState[0],
    initialState[1]
  );
  const downgradedTransitions = downgradeTransitions(sm.transitions);
  const downgradedStates = downgradeStates(sm.states);

  return {
    states: downgradedStates,
    transitions: downgradedTransitions,
    initialState: downgradedInitialState,
    platform: sm.platform,
    components: sm.components,
    parameters: {},
  };
}

function actualizeTransitions(oldTransitions: CompilerTransition[]): {
  [key: string]: Transition;
} {
  const newTransitions: {
    [key: string]: Transition;
  } = {};
  for (const oldTransition of oldTransitions) {
    newTransitions[generateId()] = {
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
    setCompilerNoDataStatus: Dispatch<SetStateAction<string>>,
    setSecondsUntilReconnect: Dispatch<SetStateAction<number | null>>
  ): void {
    super.bind(setCompilerStatus, setSecondsUntilReconnect);
    this.setCompilerData = setCompilerData;
    this.setImportData = setImportData;
    this.setCompilerNoDataStatus = setCompilerNoDataStatus;
  }

  static binary: { [id: string]: Binary[] } = {}; // id машины состояний - бинарники
  static source: { [id: string]: SourceFile[] } = {}; // id машины состояний - файлы
  // платформа на которой произвелась последняя компиляция;
  static platform: string | undefined = undefined;

  static decodeBinaries(binaries: Array<any>) {
    const decodedBinaries: Binary[] = [];
    binaries.map((binary) => {
      console.log(base64StringToBlob(binary.fileContent!));
      console.log(binary.filename, binary.extension);
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
    this.setCompilerNoDataStatus(CompilerNoDataStatus.DEFAULT);
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
      // TODO: Вернуть Берлогу
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
