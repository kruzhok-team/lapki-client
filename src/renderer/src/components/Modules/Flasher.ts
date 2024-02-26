import { Dispatch, SetStateAction } from 'react';

import Websocket from 'isomorphic-ws';

import { Binary } from '@renderer/types/CompilerTypes';
import {
  Device,
  FlashStart,
  FlashUpdatePort,
  FlasherMessage,
  UpdateDelete,
} from '@renderer/types/FlasherTypes';

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
  /*  
    максимальное количество автоматических попыток переподключения
    значение меньше нуля означает, что ограничения на попытки отсутствует
  */
  static maxReconnectAttempts: number = 3;
  // количество совершённых попыток переподключения, сбрасывается при удачном подключении или при смене хоста
  private static curReconnectAttemps: number = 0;
  /* 
  максимальное количество мс, через которое клиент будет пытаться переподключиться
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
  // true = соединение было отменено пользователем и переподключаться не нунжо.
  private static connectionCanceled: boolean = false;
  static setFlasherLog: Dispatch<SetStateAction<string | undefined>>;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
  static setFlasherConnectionStatus: Dispatch<SetStateAction<string>>;
  static setFlasherFile: Dispatch<SetStateAction<string | null | undefined>>;
  static setFlashing: Dispatch<SetStateAction<boolean>>;
  // сообщение об ошибке, undefined означает, что ошибки нет
  static setErrorMessage: Dispatch<SetStateAction<string | undefined>>;

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
    setFlasherConnectionStatus: Dispatch<SetStateAction<string>>,
    setFlasherLog: Dispatch<SetStateAction<string | undefined>>,
    setFlasherFile: Dispatch<SetStateAction<string | undefined | null>>,
    setFlashing: Dispatch<SetStateAction<boolean>>,
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>
  ): void {
    this.setFlasherConnectionStatus = setFlasherConnectionStatus;
    this.setFlasherDevices = setFlasherDevices;
    this.setFlasherLog = setFlasherLog;
    this.setFlasherFile = setFlasherFile;
    this.setFlashing = setFlashing;
    this.setErrorMessage = setErrorMessage;
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
  // переподключение к последнему адресом к которому Flasher пытался подключиться
  static reconnect() {
    this.connect(this.host, this.port);
  }
  /*
   подключение к заданному хосту и порту, если оба параметра не заданы, то идёт подключение к локальному хосту, если только один из параметров задан, то меняется только тот параметр, что был задан.
  */
  static async connect(
    host: string | undefined = undefined,
    port: number | undefined = undefined
  ): Promise<Websocket | undefined> {
    if (this.connecting) return;
    this.connecting = true;
    this.setFlasherConnectionStatus(FLASHER_CONNECTING);
    this.clearTimer();
    // if (host == undefined && port == undefined) {
    // Flasher.host = window.api.FLASHER_LOCAL_HOST;
    // await window.electron.ipcRenderer.invoke('Flasher:getPort').then(function (localPort) {
    //   Flasher.port = localPort;
    // });
    // } else {

    if (host != undefined) {
      Flasher.host = host;
    }
    if (port != undefined) {
      Flasher.port = port;
    }
    // }
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
      ws.onmessage = (msg: Websocket.MessageEvent) => {
        const response = JSON.parse(msg.data as string) as FlasherMessage;
        switch (response.type) {
          case 'flash-next-block': {
            this.setFlashing(true);
            this.sendBlob();
            break;
          }
          case 'flash-not-supported': {
            this.setFlasherLog(
              `Устройство ${response.payload} не поддерживается для прошивки в данной версии IDE`
            );
            break;
          }
          case 'device': {
            if (this.addDevice(response.payload as Device)) {
              this.setFlasherLog('Добавлено устройство!');
            } else {
              this.setFlasherLog('Состояние об устройстве синхронизировано');
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
            this.setFlasherLog('Не удалось распарсить json-сообщение от клиента');
            break;
          }
          case 'flash-done': {
            this.flashingEnd();
            this.setFlasherLog(`Загрузка завершена!\n${response.payload}`);
            break;
          }
          case 'flash-blocked': {
            this.setFlasherLog('Устройство заблокировано другим пользователем для прошивки');
            break;
          }
          case 'flash-large-file': {
            this.flashingEnd();
            this.setFlasherLog(
              'Указанный размер файла превышает максимально допустимый размер файла, установленный сервером.'
            );
            break;
          }
          case 'flash-avrdude-error': {
            this.flashingEnd();
            this.setFlasherLog(`${response.payload}`);
            break;
          }
          case 'flash-disconnected': {
            this.flashingEnd();
            this.setFlasherLog(
              'Не удалось выполнить операцию прошивки, так как устройство больше не подключено'
            );
            break;
          }
          case 'flash-wrong-id': {
            this.flashingEnd();
            this.setFlasherLog(
              'Не удалось выполнить операцию прошивки, так как так устройство не подключено'
            );
            break;
          }
          case 'flash-not-finished': {
            this.setFlasherLog('Предыдущая операция прошивки ещё не завершена');
            break;
          }
          case 'flash-not-started': {
            this.setFlasherLog('Получены бинарные данных, хотя запроса на прошивку не было');
            break;
          }
          case 'event-not-supported': {
            this.setFlasherLog('Загрузчик получил неизвестный тип сообщения');
            break;
          }
          case 'get-list-cooldown': {
            this.setFlasherLog(
              'Запрос на обновление списка устройств отклонён, потому что он недавно был обновлён'
            );
            break;
          }
          case 'empty-list': {
            this.setFlasherLog('Устройства не найдены');
          }
        }
      };
    };

    ws.onclose = async (event) => {
      if (!event.wasClean) {
        if (this.connecting) {
          this.setErrorMessage(`Не удалось подключиться к серверу ${this.host}:${this.port}`);
        } else {
          this.setErrorMessage(
            `Соедиение с сервером ${this.host}:${this.port} прервано неожиданно, возможно сеть недоступна или произошёл сбой на сервере`
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

  static flashingEnd() {
    this.setFlashing(false);
    this.setFlasherFile(undefined);
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
    const openData: [boolean, string | null, string | null, any] =
      await window.electron.ipcRenderer.invoke('dialog:openBinFile');
    if (openData[0]) {
      const buffer: Buffer = openData[3];
      //console.log(buffer.toString());
      Flasher.binary = new Blob([buffer]);
      this.setFlasherFile(openData[2]);
    } else {
      //console.log('set file (false)');
      this.setFlasherFile(undefined);
    }
  }

  static flashCompiler(binaries: Array<Binary>, deviceID: string): void {
    binaries.map((bin) => {
      if (bin.extension.endsWith('ino.hex')) {
        Flasher.binary = new Blob([bin.fileContent as Uint8Array]);
        return;
      }
    });
    this.flash(deviceID);
  }

  static flash(deviceID: string) {
    this.refresh();
    const payload = {
      deviceID: deviceID,
      fileSize: Flasher.binary.size,
    } as FlashStart;
    const request = {
      type: 'flash-start',
      payload: payload,
    } as FlasherMessage;
    this.connection?.send(JSON.stringify(request));
    this.setFlasherLog('Идет загрузка...');
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
