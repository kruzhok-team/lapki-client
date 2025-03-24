import Websocket from 'isomorphic-ws';

import { Device, ArduinoDevice } from '@renderer/components/Modules/Device';
import { Binary } from '@renderer/types/CompilerTypes';
import { FlasherMessage, FlasherPayload, FlasherType } from '@renderer/types/FlasherTypes';

import { SerialMonitor, SERIAL_MONITOR_CONNECTED } from './SerialMonitor';
import { ClientWS } from './Websocket/ClientWS';

export class Flasher extends ClientWS {
  // Переменные, связанные с отправкой бинарных данных
  // TODO: сделать приватными, доступ через set/get, если нужно
  static reader: FileReader;
  static binary: Blob;
  static currentBlob: Blob;
  static filePos: number = 0;
  static blobSize: number = 1024;

  // TODO: добавить в useFlasher?
  static currentFlashingDevice: Device | undefined = undefined;
  // сообщение об ошибке, undefined означает, что ошибки нет
  static setErrorMessage: (newError: string | undefined) => void;
  static setFlasherMessage: (msg: FlasherMessage) => void;

  //Когда прочитывает блоб - отправляет его
  static initReader(reader): void {
    this.reader = reader;
    this.reader.onloadend = function (evt) {
      if (evt.target?.readyState === FileReader.DONE) {
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
    setErrorMessage: (newError: string | undefined) => void,
    setFlasherConnectionStatus: (newConnectionStatus: string) => void,
    setSecondsUntilReconnect: (newSeconds: number | null) => void,
    setFlasherMessage: (msg: FlasherMessage) => void
  ): void {
    super.bind(setFlasherConnectionStatus, setSecondsUntilReconnect);
    this.setFlasherMessage = setFlasherMessage;
    this.setErrorMessage = setErrorMessage;
  }

  static getList(): void {
    this.send('get-list', undefined);
  }

  static refresh(): void {
    this.filePos = 0;
  }

  static extractBinaries(binaries: Array<Binary>, device: Device) {
    let ending: string;
    if (device.isArduinoDevice()) {
      ending = 'ino.hex';
    } else if (device.isMSDevice()) {
      ending = 'bin';
    } else {
      throw new Error('Попытка задать бинарные данные для неизвестной платформы!');
    }
    for (const bin of binaries) {
      if (bin.extension.endsWith(ending)) {
        if (bin.fileContent instanceof Blob) {
          return bin.fileContent;
        } else {
          return new Blob([bin.fileContent]);
        }
      }
    }
    return null;
  }

  static setBinaryFromCompiler(binaries: Array<Binary>, device: Device) {
    const extracted = this.extractBinaries(binaries, device);
    if (extracted === null) {
      throw new Error(
        `Не удаётся извлечь бинарные данные для устройства ${device.displayName()}. Переданный бинарный массив: ${binaries}`
      );
    }
    Flasher.binary = extracted;
  }

  static setBinary(binary: Blob) {
    Flasher.binary = binary;
  }

  static async openAndSetFile() {
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
      return true;
    } else {
      //console.log('set file (false)');
      return false;
    }
  }
  /**
   * Эту функцию следует вызывать перед прошивкой. Она проверяет наличие бинарных данных для прошивки,
   * закрывает монитор порта для arduino.
   * @param device устройство на которое будет загружена прошивка
   * @param serialMonitorDevice устройство для которого открыт монитор порта
   * @param serialConnectionStatus статус монитора порта
   */
  static flashPreparation(
    device: Device,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ) {
    if (!Flasher.binary) {
      throw new Error('Отсутствуют бинарные данные');
    }
    if (
      device instanceof ArduinoDevice &&
      serialMonitorDevice &&
      serialMonitorDevice.deviceID === device.deviceID &&
      serialConnectionStatus === SERIAL_MONITOR_CONNECTED
    ) {
      /*
      см. 'flash-open-serial-monitor' в Flasher.ts обработку случая, 
      когда монитор порта не успевает закрыться перед отправкой запроса на прошивку
      */
      SerialMonitor.closeMonitor(serialMonitorDevice.deviceID);
    }
    this.currentFlashingDevice = device;
    this.refresh();
  }

  static flashCompiler(
    binaries: Array<Binary>,
    device: Device,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ): void {
    this.setBinaryFromCompiler(binaries, device);
    this.flash(device, serialMonitorDevice, serialConnectionStatus);
  }

  static flash(
    device: Device,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ) {
    this.flashPreparation(device, serialMonitorDevice, serialConnectionStatus);
    this.send('flash-start', {
      deviceID: device.deviceID,
      fileSize: Flasher.binary.size,
    });
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
    const flasherMessage = JSON.parse(msg.data as string) as FlasherMessage;
    this.setFlasherMessage(flasherMessage);
  }

  static send(type: FlasherType, payload: FlasherPayload) {
    const request = {
      type: type,
      payload: payload,
    } as FlasherMessage;
    this.connection?.send(JSON.stringify(request));
  }
}
