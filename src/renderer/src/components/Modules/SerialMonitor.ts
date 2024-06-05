import { Dispatch, SetStateAction } from 'react';

import Websocket from 'isomorphic-ws';

import {
  Device,
  FlashStart,
  FlashUpdatePort,
  SerialMonitorMessage,
} from '@renderer/types/SerialMonitorTypes';

export const SERIAL_MONITOR_CONNECTING = 'Идет подключение...';
export const SERIAL_MONITOR_CONNECTED = 'Подключен';
export const SERIAL_MONITOR_NO_CONNECTION = 'Не подключен';
export const SERIAL_MONITOR_CONNECTION_ERROR = 'Ошибка при попытке подключиться';

export class SerialMonitor {
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
  static setFlasherLog: Dispatch<SetStateAction<string | undefined>>;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
  static setFlasherConnectionStatus: (newConnectionStatus: string) => void;
  static setFlasherFile: Dispatch<SetStateAction<string | null | undefined>>;
  static setFlashing: (flashing: boolean) => void;
  // сообщение об ошибке, undefined означает, что ошибки нет
  static setErrorMessage: Dispatch<SetStateAction<string | undefined>>;

  //Когда прочитывает блоб - отправляет его
  static initReader(reader): void {
    this.reader = reader;
    this.reader.onloadend = function (evt) {
      if (evt.target?.readyState == FileReader.DONE) {
        console.log('BLOB');
        SerialMonitor.connection?.send(this.result as ArrayBuffer);
        SerialMonitor.filePos += SerialMonitor.currentBlob.size;
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
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>
  ): void {
    this.setFlasherConnectionStatus = setFlasherConnectionStatus;
    this.setFlasherDevices = setFlasherDevices;
    this.setFlasherLog = setFlasherLog;
    this.setFlasherFile = setFlasherFile;
    this.setFlashing = setFlashing;
    this.setErrorMessage = setErrorMessage;
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
      } as SerialMonitorMessage)
    );
    this.setFlasherLog('Запрос на обновление списка отправлен!');
  }

  static checkConnection(): boolean {
    return this.connection !== undefined;
  }
  /** переподключение к последнему адресом к которому SerialMonitor пытался подключиться*/
  static reconnect() {
    this.connect(this.host, this.port);
  }
  /** 
   подключение к заданному хосту и порту, если оба параметра не заданы, то идёт подключение к локальному хосту, если только один из параметров задан, то меняется только тот параметр, что был задан.
  */
  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    if (this.connecting) return;
    this.connecting = true;
    this.setFlasherConnectionStatus(SERIAL_MONITOR_CONNECTING);
    this.clearTimer();

    this.host = host;
    this.port = port;

    const new_address = this.makeAddress(this.host, this.port);
    // означает, что хост должен смениться
    if (new_address != this.base_address) {
      this.curReconnectAttemps = 1;
      this.base_address = new_address;
      this.timeout = this.initialTimeout;
    }
    host = this.host;
    port = this.port;
    this.connection?.close();
    this.setFlasherDevices(new Map());
    this.connectionCanceled = false;

    let ws: Websocket;
    try {
      ws = new Websocket(this.base_address);
      this.connection = ws;
      this.setErrorMessage(undefined);
    } catch (error) {
      this.setErrorMessage(`${error}`);
      console.log('Serial monitor websocket error', error);
      this.setFlasherConnectionStatus(SERIAL_MONITOR_CONNECTION_ERROR);
      this.end();
      return;
    }

    ws.onopen = () => {
      this.curReconnectAttemps = 0;
      console.log(`Flasher: connected to ${this.host}:${this.port}!`);
      this.setErrorMessage(undefined);
      this.setFlashing(false);
      this.setFlasherFile(undefined);
      this.setFlasherConnectionStatus(SERIAL_MONITOR_CONNECTED);

      this.connecting = false;
      this.setFlasherDevices(new Map());
      // Обработка сообщений согласно протоколу:
      // https://github.com/kruzhok-team/lapki-flasher/tree/main?tab=readme-ov-file#%D0%BF%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB-%D0%B4%D0%BB%D1%8F-%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D1%8F-%D1%81-%D0%BA%D0%BB%D0%B8%D0%B5%D0%BD%D1%82%D0%BE%D0%BC
      ws.onmessage = (msg: Websocket.MessageEvent) => {
        const response = JSON.parse(msg.data as string) as SerialMonitorMessage;
        switch (response.type) {
          case 'flash-next-block': {
            this.setFlashing(true);
            this.sendBlob();
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
          case 'flash-blocked': {
            this.setFlasherLog('Устройство заблокировано другим пользователем для прошивки.');
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
            this.setFlasherLog('Загрузчик получил неизвестный тип сообщения.');
            break;
          }
          case 'empty-list': {
            this.setFlasherLog('Устройства не найдены.');
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
      if (host == this.host && port == this.port) {
        this.setFlasherConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
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
  static flashingEnd(result: string) {
    this.setFlashing(false);
    this.setFlasherFile(undefined);
    this.setFlasherLog(result);
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
      this.binary = new Blob([buffer]);
      this.setFlasherFile(openData[2]);
    } else {
      //console.log('set file (false)');
      this.setFlasherFile(undefined);
    }
  }

  static flash(device: Device) {
    this.refresh();
    const payload = {
      deviceID: device.deviceID,
      fileSize: this.binary.size,
    } as FlashStart;
    const request = {
      type: 'flash-start',
      payload: payload,
    } as SerialMonitorMessage;
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
    this.curReconnectAttemps = 0;
  }
}
