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
} from '@renderer/types/FlasherTypes';

import { ClientWS } from './ClientWS';

export class Flasher extends ClientWS {
  static devices: Map<string, Device>;

  // Переменные, связанные с отправкой бинарных данных
  static reader: FileReader;
  static binary: Blob;
  static currentBlob: Blob;
  static filePos: number = 0;
  static blobSize: number = 1024;
  private static currentFlashingDevice: Device | undefined = undefined;
  static setFlasherLog: Dispatch<SetStateAction<string | undefined>>;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
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
    super.bindReactSuper(setFlasherConnectionStatus);
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
    return `${super.makeAddress(host, port)}/flasher`;
  }

  static errorHandler(error) {
    this.setErrorMessage(`${error}`);
    super.errorHandler(error);
  }

  static onOpenHandler() {
    super.onOpenHandler();
    console.log(`Flasher: connected to ${Flasher.host}:${Flasher.port}!`);
    this.setErrorMessage(undefined);
    this.setFlashing(false);
    this.setFlasherFile(undefined);
    this.setFlasherDevices(new Map());
  }

  static closeHandler(host: string, port: number, event: Websocket.CloseEvent) {
    if (!event.wasClean) {
      if (this.connection && this.connection.CONNECTING) {
        this.setErrorMessage(`Не удалось подключиться к серверу ${this.host}:${this.port}.`);
      } else {
        this.setErrorMessage(
          `Соединение с сервером ${this.host}:${this.port} прервано неожиданно, возможно сеть недоступна или произошёл сбой на сервере.`
        );
      }
    }
    super.closeHandler(host, port, event);
  }

  // обработка входящих через вебсоект сообщений
  static messageHandler(msg: Websocket.MessageEvent) {
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
        this.setFlasherLog('Не удалось прочесть запрос от клиента (возможно, конфликт версий).');
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
        this.setFlasherLog('Загрузчик получил неизвестный тип сообщения.');
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
      }
    }
  }
}
