import { Dispatch, SetStateAction } from 'react';

import Websocket from 'isomorphic-ws';

import { Device, ArduinoDevice, MSDevice } from '@renderer/components/Modules/Device';
import { Binary } from '@renderer/types/CompilerTypes';
import {
  FlashUpdatePort,
  FlasherMessage,
  UpdateDelete,
  FlashResult,
  DeviceCommentCode,
  SerialRead,
  FlasherPayload,
  FlasherType,
  MSPingResult,
} from '@renderer/types/FlasherTypes';

import { ManagerMS } from './ManagerMS';
import {
  SerialMonitor,
  SERIAL_MONITOR_CONNECTED,
  SERIAL_MONITOR_NO_CONNECTION,
} from './SerialMonitor';
import { ClientWS } from './Websocket/ClientWS';

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
  static onFlashingChange: (flashing: boolean) => void;
  // сообщение об ошибке, undefined означает, что ошибки нет
  static setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  // сообщение о результате последней попытки прошить устройство
  // если информации о последней прошивки нет, то равняется undefined
  static setFlashResult: Dispatch<SetStateAction<FlashResult | undefined>>;

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
    setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>,
    setFlasherConnectionStatus: (newConnectionStatus: string) => void,
    setFlasherLog: Dispatch<SetStateAction<string | undefined>>,
    setFlasherFile: Dispatch<SetStateAction<string | undefined | null>>,
    onFlashingChange: (flashing: boolean) => void,
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>,
    setFlashResult: Dispatch<SetStateAction<FlashResult | undefined>>,
    setSecondsUntilReconnect: Dispatch<SetStateAction<number | null>>
  ): void {
    super.bind(setFlasherConnectionStatus, setSecondsUntilReconnect);
    this.setFlasherDevices = setFlasherDevices;
    this.setFlasherLog = setFlasherLog;
    this.setFlasherFile = setFlasherFile;
    this.onFlashingChange = onFlashingChange;
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
    if (isNew) {
      this.setFlasherLog('Добавлено устройство!');
    }
    return isNew;
  }

  static deleteDevice(deviceID: string): void {
    this.setFlasherDevices((oldValue) => {
      const newValue = new Map(oldValue);
      newValue.delete(deviceID);
      return newValue;
    });
  }

  // обновление порта (только для ArduinoDevice)
  /**
   * обновление порта (сообщение приходит только для {@link ArduinoDevice})
   * @param port сообщение от сервера об обновлении порта
   */
  static updatePort(port: FlashUpdatePort): void {
    this.setFlasherDevices((oldValue) => {
      const newValue = new Map(oldValue);
      const device = newValue.get(port.deviceID)! as ArduinoDevice;
      device.portName = port.portName;
      newValue.set(port.deviceID, device);

      return newValue;
    });
  }

  static getList(): void {
    this.send('get-list', undefined);
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
    this.onFlashingChange(false);
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

  static flashPreparation(
    device: Device,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ) {
    if (
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
    this.setFlasherLog('Идет загрузка...');
  }

  static flashCompiler(
    binaries: Array<Binary>,
    device: Device,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ): void {
    binaries.map((bin) => {
      if (bin.extension.endsWith('ino.hex')) {
        Flasher.binary = new Blob([bin.fileContent as unknown as Uint8Array]);
        return;
      }
    });
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
    this.onFlashingChange(false);
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
        this.onFlashingChange(true);
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
        const device = new ArduinoDevice(response.payload as ArduinoDevice);
        this.addDevice(device);
        break;
      }
      case 'ms-device': {
        const device = new MSDevice(response.payload as MSDevice);
        this.addDevice(device);
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
      case 'unmarshal-err': {
        this.setFlasherLog('Не удалось прочесть запрос от клиента (возможно, конфликт версий).');
        break;
      }
      case 'flash-done': {
        this.flashingEnd('Загрузка завершена.', `${response.payload}.`);
        break;
      }
      case 'flash-blocked': {
        this.flashingEnd('Устройство заблокировано другим пользователем для прошивки.', undefined);
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
        this.flashingEnd(
          'Сервер начал получать файл с прошивкой, но процесс загрузки не был инициализирован.',
          undefined
        );
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
        break;
      }
      case 'serial-connection-status': {
        const serialStatus = response.payload as DeviceCommentCode;
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
        const serialStatus = response.payload as DeviceCommentCode;
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
      case 'flash-open-serial-monitor':
        // если не удалось закрыть монитор порта перед прошивкой, то повторяем попытку (см. handleFlash из Loader.tsx)
        // обычно монитор порта закрывается с первой попытки и этот код не воспроизводится
        console.log('flash-open-serial-monitor');
        if (this.currentFlashingDevice) {
          SerialMonitor.closeMonitor(this.currentFlashingDevice.deviceID);
          this.flash(this.currentFlashingDevice);
        } else {
          /*
            если эта ошибка получена и currentFlashingDevice == undefined, то значит что-то пошло не так, 
            ведь перед тем как получить эту ошибку клиент должен вызвать функцию flash в которой назначается 
            currentFlashingDevice
          */
          this.flashingEnd(
            'Получена неожиданная ошибка типа "flash-open-serial-monitor", сообщите об этом разработчикам! Эта ошибка означает, что монитор порта не удалось отключить автоматически перед тем, как начать прошивку. Вам придётся самостоятельно отключить монитор порта и повторить попытку прошивки.',
            undefined
          );
        }
        break;
      case 'ms-ping-result':
        {
          const pingResult = response.payload as MSPingResult;
          switch (pingResult.code) {
            case 0:
              ManagerMS.addLog('Получен ответ устройства на пинг');
              break;
            case 1:
              ManagerMS.addLog('Не удалось отправить пинг, так как устройство не подключено.');
              break;
            case 2:
              ManagerMS.addLog('Возникла ошибка при попытке отправить пинг.');
              break;
          }
        }
        break;
      case 'ms-address': {
        const getAddressStatus = response.payload as DeviceCommentCode;
        switch (getAddressStatus.code) {
          case 0:
            ManagerMS.addLog(`Получен адрес устройства: ${getAddressStatus.comment}`);
            ManagerMS.setAddress(getAddressStatus.comment);
            break;
          case 1:
            ManagerMS.addLog('Не удалось получить адрес устройства, так как оно не подключено.');
            ManagerMS.setAddress('');
            break;
          case 2: {
            const errorText = getAddressStatus.comment;
            const errorLog = 'Возникла ошибка при попытке узнать адрес';
            if (errorText != '') {
              ManagerMS.addLog(`${errorLog}. Текст ошибки: ${getAddressStatus.comment}`);
            } else {
              ManagerMS.addLog(`${errorLog}.`);
            }
            ManagerMS.setAddress('');
            break;
          }
        }
      }
    }
  }

  static send(type: FlasherType, payload: FlasherPayload) {
    const request = {
      type: type,
      payload: payload,
    } as FlasherMessage;
    this.connection?.send(JSON.stringify(request));
  }
}
