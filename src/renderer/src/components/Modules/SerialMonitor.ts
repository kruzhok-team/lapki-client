import { Buffer } from 'buffer';

import { dateFormatTime } from '@renderer/utils';

import { Device } from './Device';
import { Flasher } from './Flasher';

export const SERIAL_MONITOR_CONNECTING = 'Идет подключение...';
export const SERIAL_MONITOR_CONNECTED = 'Подключено';
export const SERIAL_MONITOR_NO_CONNECTION = 'Не подключено';
export const SERIAL_MONITOR_NO_SERVER_CONNECTION = 'Отсутствует подключение к серверу';

export class SerialMonitor {
  static addDeviceMessages: (newDeviceMessage: string) => void;
  static setDevice: (currentDevice: Device | undefined) => void;
  static setConnectionStatus: (connectionStatus: string) => void;
  static setLog: (update: (prevMessages: string[]) => string[]) => void;

  static bindReact(
    addMessages: (newDeviceMessage: string) => void,
    setDevice: (currentDevice: Device | undefined) => void,
    setConnectionStatus: (connectionStatus: string) => void,
    setLog: (update: (prevMessages: string[]) => string[]) => void
  ): void {
    this.addDeviceMessages = addMessages;
    this.setDevice = setDevice;
    this.setConnectionStatus = setConnectionStatus;
    this.setLog = setLog;
  }

  //Функция для формирования сообщения
  static addDeviceMessage(message) {
    this.addDeviceMessages(message);
  }

  static openMonitor(device: Device, baudRate: number) {
    this.setDevice(device);
    this.setConnectionStatus(SERIAL_MONITOR_CONNECTING);
    Flasher.send('serial-connect', {
      deviceID: device.deviceID,
      baud: baudRate,
    });
  }

  static closeMonitor(deviceID: string) {
    Flasher.send('serial-disconnect', {
      deviceID: deviceID,
    });
  }

  static sendMessage(deviceID: string, buffer: Buffer) {
    Flasher.send('serial-send', {
      deviceID: deviceID,
      msg: buffer.toString('base64'),
    });
  }

  static timeStamp(log: string) {
    const date = new Date();
    return `${dateFormatTime(date)} - ${log}`;
  }

  static addLog(log: string) {
    this.setLog((prevMessages) => [...prevMessages, this.timeStamp(log)]);
  }

  static changeBaud(deviceID: string, baud: number) {
    Flasher.send('serial-change-baud', {
      deviceID: deviceID,
      baud: baud,
    });
  }

  static toHex(buffer: Buffer): string {
    const hex = buffer.toString('hex');
    let spacedHex = '';
    for (let i = 0; i < hex.length; i += 2) {
      spacedHex += hex[i] + hex[i + 1] + ' ';
    }
    return spacedHex;
  }

  static toText(buffer: Buffer): string {
    return buffer.toString('utf-8');
  }
}
