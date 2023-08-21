import { Binary } from '@renderer/types/CompilerTypes';
import {
  Device,
  FlashStart,
  FlashUpdatePort,
  FlasherMessage,
  UpdateDelete,
} from '@renderer/types/FlasherTypes';
import Websocket from 'isomorphic-ws';
import { Dispatch, SetStateAction } from 'react';

export class Flasher {
  static port = 8080;
  static host = 'localhost';
  static base_address = this.makeAddress(this.host, this.port);
  static connection: Websocket | undefined;
  static connecting: boolean = false;
  static timerID: NodeJS.Timeout | undefined;
  // на сколько мс увеличивается время перед новой попыткой подключения
  static incTimeout: number = 5000;
  // максимальное количество мс, через которое клиент будет пытаться переподключиться
  static maxTimeout: number = 60000;
  static devices: Map<string, Device>;

  // Переменные, связанные с отправкой бинарных данных
  static reader: FileReader;
  static binary: Blob;
  static currentBlob: Blob;
  static filePos: number = 0;
  static blobSize: number = 1024;
  static setFlasherLog: Dispatch<SetStateAction<string | undefined>>;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
  static setFlasherConnectionStatus: Dispatch<SetStateAction<string>>;

  static changeHost(host: string, port: number) {
    this.host = host;
    this.port = port;
    let new_address = this.makeAddress(host, port);
    console.log(`Changing host from ${this.base_address} to ${new_address}`);
    if (new_address == this.base_address) {
      return;
    }
    this.base_address = new_address;
    this.connection?.close();
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
    }
    this.connection = undefined;

    this.setFlasherConnectionStatus('Подключение к новому хосту...');
    this.setFlasherDevices(new Map());
    this.connect(this.base_address);
  }

  //Когда прочитывает блоб - отправляет его
  static initReader(reader): void {
    this.reader = reader;
    this.reader.onloadend = function (evt) {
      if (evt.target?.readyState == FileReader.DONE) {
        console.log('BLOB');
        Flasher.connection.send(Flasher.currentBlob);
        Flasher.filePos += Flasher.currentBlob.size;
      }
    };
  }

  static async sendBlob(): Promise<void> {
    var first = this.filePos;
    var last = first + this.blobSize;
    if (last > this.binary.size) {
      last = this.binary.size;
    }
    this.currentBlob = this.binary.slice(first, last);
    this.reader.readAsArrayBuffer(this.currentBlob);
  }

  static bindReact(
    setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>,
    setFlasherConnectionStatus: Dispatch<SetStateAction<string>>,
    setFlasherLog: Dispatch<SetStateAction<string | undefined>>
  ): void {
    this.setFlasherConnectionStatus = setFlasherConnectionStatus;
    this.setFlasherDevices = setFlasherDevices;
    this.setFlasherLog = setFlasherLog;
  }
  /*
    Добавляет устройство в список устройств

    @param {device} устройство для добавления
    @returns {isNew} true, если устройство новое, иначе false
  */
  static addDevice(device: Device): boolean {
    let isNew: boolean = false;
    this.setFlasherDevices((oldValue) => {
      console.log(device);
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
      console.log(port.deviceID);
      console.log(oldValue);
      console.log(newValue.get(port.deviceID));
      console.log(oldValue.get(port.deviceID));
      const device = newValue.get(port.deviceID)!;
      device.portName = port.portName;
      newValue.set(port.deviceID, device);

      return newValue;
    });
  }

  static getList(): void {
    this.connection.send(
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

  static connect(route: string, timeout: number = 0): Websocket {
    if (this.checkConnection()) return this.connection!;
    if (this.connecting) return;

    const ws = new Websocket(route);
    this.setFlasherConnectionStatus('Идет подключение...');
    this.connecting = true;
    console.log(`TIMEOUT=${timeout}, ROUTE=${route}`);

    ws.onopen = () => {
      console.log('Flasher: connected!');
      this.setFlasherConnectionStatus('Подключен');

      this.connection = ws;
      this.connecting = false;
      this.setFlasherDevices(new Map());

      ws.onmessage = (msg: MessageEvent) => {
        console.log(msg.data);
        const response = JSON.parse(msg.data) as FlasherMessage;
        switch (response.type) {
          case 'flash-next-block': {
            this.sendBlob();
            break;
          }
          case 'flash-done': {
            this.setFlasherLog(`Загрузка завершена!\n${response.payload}`);
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
          case 'flash-blocked': {
            this.setFlasherLog('Устройство заблокировано другим пользователем для прошивки');
            break;
          }
          case 'flash-large-file': {
            this.setFlasherLog(
              'Указанный размер файла превышает максимально допустимый размер файла, установленный сервером.'
            );
            break;
          }
          case 'flash-avrdude-error': {
            this.setFlasherLog(`${response.payload}`);
            break;
          }
          case 'flash-disconnected': {
            this.setFlasherLog(
              'Не удалось выполнить операцию прошивки, так как устройство больше не подключено'
            );
            break;
          }
          case 'flash-wrong-id': {
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

    ws.onclose = () => {
      console.log(`flasher closed ${route}, ${timeout}, ${this.base_address}`);
      if (this.base_address == route) {
        this.connecting = false;
        this.setFlasherConnectionStatus('Не подключен');
        this.connection = undefined;
        this.tryToReconnect(route, timeout);
      }
    };

    return ws;
  }

  static refresh(): void {
    this.filePos = 0;
  }

  static async setBinary(binaries: Array<Binary>) {
    binaries.map((bin) => {
      console.log(bin.filename);
      if (bin.extension.endsWith('ino.hex')) {
        console.log(bin.extension);
        console.log(bin.fileContent);
        Flasher.binary = bin.fileContent as Blob;
        return;
      }
    });
  }

  static flash(binaries: Array<Binary>, deviceID: string): void {
    this.refresh();
    this.setBinary(binaries);
    console.log(typeof Flasher.binary);

    const payload = {
      deviceID: deviceID,
      fileSize: Flasher.binary.size,
    } as FlashStart;
    const request = {
      type: 'flash-start',
      payload: payload,
    } as FlasherMessage;
    console.log(request);
    this.connection.send(JSON.stringify(request));
    this.setFlasherLog('Идет загрузка...');
  }

  /*
    Переподключение к хосту 

    @param {route} адресс к которому нужно переподключиться
    @returns {timeout} время, через которое нужно осуществить переподключение (следующий вызов произойдёт через timeout+incTimeout)
  */
  static tryToReconnect(route: string, timeout: number): void {
    this.timerID = setTimeout(() => {
      console.log(`${route} inTimer: ${timeout + this.incTimeout}`);
      this.connect(route, Math.min(this.maxTimeout, timeout + this.incTimeout));
    }, timeout);
  }

  // получение адреса в виде строки
  static makeAddress(host: string, port: number): string {
    return `ws://${host}:${port}/flasher`;
  }
}
