import { Dispatch, SetStateAction } from 'react';

import Websocket from 'isomorphic-ws';

import { Binary } from '@renderer/types/CompilerTypes';
import {
  Device,
  FlashStart,
  FlashUpdatePort,
  FlasherMessage,
  UpdateDelete,
  FlashResult,
  SerialStatus,
  SerialRead,
} from '@renderer/types/FlasherTypes';

import {
  SerialMonitor,
  SERIAL_MONITOR_CONNECTED,
  SERIAL_MONITOR_NO_CONNECTION,
} from './SerialMonitor';

export const FLASHER_CONNECTING = 'Идет подключение...';
export const FLASHER_CONNECTED = 'Подключен';
export const FLASHER_NO_CONNECTION = 'Не подключен';
export const FLASHER_CONNECTION_ERROR = 'Ошибка при попытке подключиться';

export class Flasher {
  static port: number;
  static host: string;
  static base_address;
  static connection: Websocket | undefined;
  static connecting: boolean = false;
  static timerID: NodeJS.Timeout | undefined;
  // первоначальное значение timeout
  private static initialTimeout: number = 5000;
  // на сколько мс увеличивается время перед новой попыткой подключения
  private static incTimeout: number = this.initialTimeout;
  /**  
    максимальное количество автоматических попыток переподключения,
    значение меньше нуля означает, что ограничения на попытки отсутствует
  */
  static maxReconnectAttempts: number = 3;
  // количество совершённых попыток переподключения, сбрасывается при удачном подключении или при смене хоста
  private static curReconnectAttemps: number = 0;
  /**  
  максимальное количество мс, через которое клиент будет пытаться переподключиться,
  не должно быть негативным числом (поэтому не стоит делать эту переменную зависимой от maxReconnectAttempts)
  */
  static maxTimeout: number = this.incTimeout * 10;
  private static timeout: number = this.initialTimeout;
  static devices: Map<string, Device>;

  // Переменные, связанные с отправкой бинарных данных
  static reader: FileReader;
  static binary: Blob;
  static currentBlob: Blob;
  static filePos: number = 0;
  static blobSize: number = 1024;
  // true = во время вызова таймера для переключения ничего не будет происходить.
  private static freezeReconnection: boolean = false;
  // true = пытаться переподключиться автоматически
  private static reconnection: boolean = false;
  // true = соединение было отменено пользователем и переподключаться не нужно.
  private static connectionCanceled: boolean = false;
  private static currentFlashingDevice: Device | undefined = undefined;
  static setFlasherLog: Dispatch<SetStateAction<string | undefined>>;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
  static setFlasherConnectionStatus: (newConnectionStatus: string) => void;
  static setFlasherFile: Dispatch<SetStateAction<string | null | undefined>>;
  static setFlashing: (flashing: boolean) => void;
  // сообщение об ошибке, undefined означает, что ошибки нет
  static setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  // сообщение о результате последней попытки прошить устройство
  // если информации о последней прошивки нет, то равняется undefined
  static setFlashResult: Dispatch<SetStateAction<FlashResult | undefined>>;

  //Когда прочитывает блоб - отправляет его
  static initReader(reader): void {
    this.reader = reader;
    this.reader.onloadend = function (evt) {
      if (evt.target?.readyState == FileReader.DONE) {
        console.log('BLOB');
        Flasher.connection?.send(this.result as ArrayBuffer);
        Flasher.filePos += Flasher.currentBlob.size;
      }
    };
  }

  static async sendBlob(): Promise<void> {
    const first = this.filePos;
    let last = first + this.blobSize;
    if (last >= this.binary.size) {
      last = this.binary.size;
    }
    this.currentBlob = this.binary.slice(first, last);
    this.reader.readAsArrayBuffer(this.currentBlob);
  }

  static bindReact(
    setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>,
    setFlasherConnectionStatus: (newConnectionStatus: string) => void,
    setFlasherLog: Dispatch<SetStateAction<string | undefined>>,
    setFlasherFile: Dispatch<SetStateAction<string | undefined | null>>,
    setFlashing: (flashing: boolean) => void,
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>,
    setFlashResult: Dispatch<SetStateAction<FlashResult | undefined>>
  ): void {
    this.setFlasherConnectionStatus = setFlasherConnectionStatus;
    this.setFlasherDevices = setFlasherDevices;
    this.setFlasherLog = setFlasherLog;
    this.setFlasherFile = setFlasherFile;
    this.setFlashing = setFlashing;
    this.setErrorMessage = setErrorMessage;
    this.setFlashResult = setFlashResult;
  }
  /*
    Добавляет устройство в список устройств

    @param {device} устройство для добавления
    @returns {isNew} true, если устройство новое, иначе false
  */
  static addDevice(device: Device): boolean {
    let isNew: boolean = false;
    this.setFlasherDevices((oldValue) => {
      if (!oldValue.has(device.deviceID)) {
        isNew = true;
      }
      const newValue = new Map(oldValue);
      newValue.set(device.deviceID, device);
      return newValue;
    });
    return isNew;
  }

  static deleteDevice(deviceID: string): void {
    this.setFlasherDevices((oldValue) => {
      const newValue = new Map(oldValue);
      newValue.delete(deviceID);
      return newValue;
    });
  }

  static updatePort(port: FlashUpdatePort): void {
    this.setFlasherDevices((oldValue) => {
      const newValue = new Map(oldValue);
      const device = newValue.get(port.deviceID)!;
      device.portName = port.portName;
      newValue.set(port.deviceID, device);

      return newValue;
    });
  }

  static getList(): void {
    this.connection?.send(
      JSON.stringify({
        type: 'get-list',
        payload: undefined,
      } as FlasherMessage)
    );
    this.setFlasherLog('Запрос на обновление списка отправлен!');
  }

  static checkConnection(): boolean {
    return this.connection !== undefined;
  }
  /** переподключение к последнему адресу к которому Flasher пытался подключиться*/
  static reconnect() {
    this.connect(this.host, this.port);
  }
  /** 
   подключение к заданному хосту и порту, если оба параметра не заданы, то идёт подключение к локальному хосту, если только один из параметров задан, то меняется только тот параметр, что был задан.
  */
  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    if (this.connecting) return;
    this.connecting = true;
    this.setFlasherConnectionStatus(FLASHER_CONNECTING);
    this.clearTimer();

    Flasher.host = host;
    Flasher.port = port;

    const new_address = Flasher.makeAddress(Flasher.host, Flasher.port);
    // означает, что хост должен смениться
    if (new_address != Flasher.base_address) {
      Flasher.curReconnectAttemps = 1;
      Flasher.base_address = new_address;
      Flasher.timeout = Flasher.initialTimeout;
    }
    host = Flasher.host;
    port = Flasher.port;
    this.connection?.close();
    this.setFlasherDevices(new Map());
    Flasher.connectionCanceled = false;

    let ws: Websocket;
    try {
      ws = new Websocket(this.base_address);
      this.connection = ws;
      this.setErrorMessage(undefined);
    } catch (error) {
      this.setErrorMessage(`${error}`);
      console.log('Flasher websocket error', error);
      this.setFlasherConnectionStatus(FLASHER_CONNECTION_ERROR);
      this.end();
      return;
    }

    ws.onopen = () => {
      Flasher.curReconnectAttemps = 0;
      console.log(`Flasher: connected to ${Flasher.host}:${Flasher.port}!`);
      this.setErrorMessage(undefined);
      this.setFlashing(false);
      this.setFlasherFile(undefined);
      this.setFlasherConnectionStatus(FLASHER_CONNECTED);

      this.connecting = false;
      this.setFlasherDevices(new Map());
      // Обработка сообщений согласно протоколу:
      // https://github.com/kruzhok-team/lapki-flasher/tree/main?tab=readme-ov-file#%D0%BF%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB-%D0%B4%D0%BB%D1%8F-%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D1%8F-%D1%81-%D0%BA%D0%BB%D0%B8%D0%B5%D0%BD%D1%82%D0%BE%D0%BC
      ws.onmessage = (msg: Websocket.MessageEvent) => {
        const response = JSON.parse(msg.data as string) as FlasherMessage;
        switch (response.type) {
          case 'flash-next-block': {
            this.setFlashing(true);
            this.sendBlob();
            break;
          }
          case 'flash-not-supported': {
            this.flashingEnd(
              `Устройство ${response.payload} не поддерживается для прошивки в данной версии IDE.`,
              undefined
            );
            break;
          }
          case 'device': {
            if (this.addDevice(response.payload as Device)) {
              this.setFlasherLog('Добавлено устройство!');
            } else {
              this.setFlasherLog('Состояние об устройстве синхронизировано.');
            }
            break;
          }
          case 'device-update-delete': {
            this.deleteDevice((response.payload as UpdateDelete).deviceID);
            break;
          }
          case 'device-update-port': {
            this.updatePort(response.payload as FlashUpdatePort);
            break;
          }
          case 'unmarshal-error': {
            this.setFlasherLog(
              'Не удалось прочесть запрос от клиента (возможно, конфликт версий).'
            );
            break;
          }
          case 'flash-done': {
            this.flashingEnd('Загрузка завершена.', `${response.payload}.`);
            break;
          }
          case 'flash-blocked': {
            this.setFlasherLog('Устройство заблокировано другим пользователем для прошивки.');
            break;
          }
          case 'flash-large-file': {
            this.flashingEnd(
              'Указанный размер файла превышает максимально допустимый размер файла, установленный сервером.',
              undefined
            );
            break;
          }
          case 'flash-avrdude-error': {
            this.flashingEnd('Возникла ошибка во время прошивки.', `${response.payload}.`);
            break;
          }
          case 'flash-disconnected': {
            this.flashingEnd(
              'Не удалось выполнить операцию прошивки, так как устройство больше не подключено.',
              undefined
            );
            break;
          }
          case 'flash-wrong-id': {
            this.flashingEnd(
              'Не удалось выполнить операцию прошивки, так как так устройство не подключено.',
              undefined
            );
            break;
          }
          case 'flash-not-finished': {
            this.setFlasherLog('Предыдущая операция прошивки ещё не завершена.');
            break;
          }
          // эта ошибка скорее для разработчиков, чем для пользователя, она означает, что-то пошло не так на клиенте (либо на сервере)
          case 'flash-not-started': {
            this.setFlasherLog('Получен файл, хотя процесс прошивки не запускался.');
            break;
          }
          case 'event-not-supported': {
            this.setFlasherLog(`Загрузчик получил неизвестный тип сообщения.`);
            break;
          }
          case 'get-list-cooldown': {
            this.setFlasherLog(
              'Запрос на обновление списка устройств отклонён, потому что он недавно был обновлён.'
            );
            break;
          }
          case 'empty-list': {
            this.setFlasherLog('Устройства не найдены.');
            break;
          }
          case 'serial-connection-status': {
            const serialStatus = response.payload as SerialStatus;
            switch (serialStatus.code) {
              case 0:
                SerialMonitor.addLog('Открыт монитор порта!');
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
                break;
              case 1: {
                const mainMessage = 'Монитор порта закрыт';
                if (serialStatus.comment != '') {
                  SerialMonitor.addLog(`${mainMessage}. Текст ошибки: ${serialStatus.comment}`);
                } else {
                  SerialMonitor.addLog(`${mainMessage}.`);
                }
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              }
              case 2:
                SerialMonitor.addLog(`Монитор порта закрыт, так как устройство не подключено.`);
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                SerialMonitor.setDevice(undefined);
                break;
              case 3:
                SerialMonitor.addLog(`Нельзя открыть монитор порта для фальшивого устройства.`);
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 4:
                SerialMonitor.addLog(
                  `Сервер не смог обработать JSON-сообщение от клиента. Текст ошибки: ${serialStatus.comment}`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 5:
                SerialMonitor.addLog(
                  `Нельзя открыть монитор порта, так как устойство прошивается. Дождитесь окончания прошивки и повторите попытку.`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 6:
                SerialMonitor.addLog(`Монитор порта открыт другим клиентом.`);
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 7:
                SerialMonitor.addLog(
                  `Произошла ошибка чтения данных. Порт закрыт. Текст ошибки: ${serialStatus.comment}`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 8:
                SerialMonitor.addLog(`Монитор порта закрыт по вашему запросу.`);
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 9:
                SerialMonitor.addLog(
                  `Не удалось сменить скорость передачи данных. Соединение прервано. Выберите другую скорость и попробуйте снова.`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 10:
                SerialMonitor.addLog(
                  `Монитор порта заново открыт на скорости ${serialStatus.comment} бод.`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
                break;
              case 11:
                SerialMonitor.addLog(
                  `Не удалось сменить скорость передачи данных из-за ошибки обработки JSON-сообщения. Текст ошибки: ${serialStatus.comment}`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
                break;
              case 12:
                SerialMonitor.addLog(
                  `Нельзя сменить скорость передачи данных, так как монитор порта закрыт.`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 13:
                SerialMonitor.addLog(
                  `Нельзя сменить скорость передачи данных, так как монитор порта открыт другим клиентом.`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 14:
                SerialMonitor.addLog(
                  `Этот монитор порта нельзя закрыть, так как он открыт другим клиентом.`
                );
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
                break;
              case 15:
                SerialMonitor.addLog(`Старая скорость передачи данных совпадает с новой.`);
                SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
                break;
            }
            break;
          }
          case 'serial-sent-status': {
            const serialStatus = response.payload as SerialStatus;
            switch (serialStatus.code) {
              case 0:
                SerialMonitor.addLog('Сообщение доставлено на устройство.');
                break;
              case 1: {
                const mainMessage = 'Сообщение не удалось доставить на устройство';
                if (serialStatus.comment != '') {
                  SerialMonitor.addLog(`${mainMessage}. Текст ошибки: ${serialStatus.comment}`);
                } else {
                  SerialMonitor.addLog(`${mainMessage}.`);
                }
                break;
              }
              case 2:
                SerialMonitor.addLog(
                  `Сообщение не удалось доставить на устройство, так как оно не подключено.`
                );
                break;
              case 3:
                SerialMonitor.addLog(
                  `Сообщение не удалось доставить на устройство, так как монитор порта закрыт.`
                );
                break;
              case 4:
                SerialMonitor.addLog(
                  `Сообщение не удалось доставить на устройство, из-за ошибки обработки JSON. Текст ошибки: ${serialStatus.comment}`
                );
                break;
              case 5:
                SerialMonitor.addLog(
                  `Сообщение не удалось доставить на устройство, так его монитор порта открыт другим клиентом.`
                );
                break;
            }
            break;
          }
          case 'serial-device-read': {
            const serialRead = response.payload as SerialRead;
            SerialMonitor.addDeviceMessage(serialRead.msg);
            break;
          }
          case 'flash-open-serial-monitor': {
            this.flashingEnd(
              'Нельзя начать прошивку этого устройства, так как для него открыт монитора порта.',
              undefined
            );
          }
        }
      };
    };

    ws.onclose = async (event) => {
      if (!event.wasClean) {
        if (this.connecting) {
          this.setErrorMessage(`Не удалось подключиться к серверу ${this.host}:${this.port}.`);
        } else {
          this.setErrorMessage(
            `Соединение с сервером ${this.host}:${this.port} прервано неожиданно, возможно сеть недоступна или произошёл сбой на сервере.`
          );
        }
      }
      if (host == Flasher.host && port == Flasher.port) {
        this.setFlasherConnectionStatus(FLASHER_NO_CONNECTION);
        this.end();
        if (this.reconnection) {
          this.tryToReconnect();
        }
      }
    };

    return ws;
  }

  // действия после закрытии или ошибке соединения
  private static end() {
    this.connecting = false;
    this.connection = undefined;
  }

  /**
   * Обработка завершения процесса прошивки
   *
   * Следует вызывать сразу после завершения прошивки
   *
   * Обновляет лог (@var setFlasherLog)
   *
   * Обновляет результат прошивки (@var setFlashResult)
   * @param {string} result - описание результата прошивки для пользователя, используется для обновление лога и результата прошивки
   * @param {string | undefined} avrdudeMsg - сообщение от avrdude, undefined - если отсутствует
   * */
  static flashingEnd(result: string, avrdudeMsg: string | undefined) {
    this.setFlashing(false);
    this.setFlasherFile(undefined);
    this.setFlasherLog(result);
    this.setFlashResult(new FlashResult(this.currentFlashingDevice, result, avrdudeMsg));
    this.currentFlashingDevice = undefined;
  }

  static refresh(): void {
    this.filePos = 0;
  }

  static setAutoReconnect(reconnect: boolean) {
    if (!reconnect) {
      this.clearTimer();
    }
    this.reconnection = reconnect;
  }

  // безопасное отключение таймера для переподключения
  private static clearTimer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
    }
  }

  static async setBinary(binaries: Array<Binary>) {
    binaries.map((bin) => {
      if (bin.extension.endsWith('ino.hex')) {
        Flasher.binary = bin.fileContent as Blob;
        return;
      }
    });
  }

  static async setFile() {
    /* 
    openData[0] - удалось ли открыть и прочитать файл
    openData[1] путь к файлу
    openData[2] название файла
    openData[3] данные из файла
    */
    const openData = await window.api.fileHandlers.openBinFile();
    if (openData[0]) {
      const buffer = openData[3] as Buffer;
      //console.log(buffer.toString());
      Flasher.binary = new Blob([buffer]);
      this.setFlasherFile(openData[2]);
    } else {
      //console.log('set file (false)');
      this.setFlasherFile(undefined);
    }
  }

  static flashCompiler(binaries: Array<Binary>, device: Device): void {
    binaries.map((bin) => {
      if (bin.extension.endsWith('ino.hex')) {
        Flasher.binary = new Blob([bin.fileContent as Uint8Array]);
        return;
      }
    });
    this.flash(device);
  }

  static flash(device: Device) {
    this.refresh();
    const payload = {
      deviceID: device.deviceID,
      fileSize: Flasher.binary.size,
    } as FlashStart;
    const request = {
      type: 'flash-start',
      payload: payload,
    } as FlasherMessage;
    this.connection?.send(JSON.stringify(request));
    this.setFlasherLog('Идет загрузка...');
    this.currentFlashingDevice = device;
  }

  // получение адреса в виде строки
  static makeAddress(host: string, port: number): string {
    return `ws://${host}:${port}/flasher`;
  }

  static freezeReconnectionTimer(freeze: boolean) {
    this.freezeReconnection = freeze;
  }

  private static tryToReconnect() {
    if (
      this.connectionCanceled ||
      (this.maxReconnectAttempts >= 0 && this.curReconnectAttemps >= this.maxReconnectAttempts)
    ) {
      return;
    }
    this.timerID = setTimeout(() => {
      console.log(`${this.base_address} inTimer: ${this.timeout}`);
      if (!this.freezeReconnection) {
        this.timeout = Math.min(this.timeout + this.incTimeout, this.maxTimeout);
        this.curReconnectAttemps++;
        this.reconnect();
      } else {
        console.log('the timer is frozen');
        if (this.timeout == 0) {
          this.timeout = Math.min(this.incTimeout, this.maxTimeout);
          this.tryToReconnect();
        } else {
          this.tryToReconnect();
        }
      }
    }, this.timeout);
  }

  // отмена подключения
  static cancelConnection() {
    this.connection?.close();
    this.clearTimer();
    this.connectionCanceled = true;
    Flasher.curReconnectAttemps = 0;
  }
}
