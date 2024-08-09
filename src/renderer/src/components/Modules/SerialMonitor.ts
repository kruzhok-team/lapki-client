import {
  Device,
  FlasherMessage,
  SerialChangeBaud,
  SerialConnect,
  SerialDisconnect,
  SerialSend,
} from '@renderer/types/FlasherTypes';

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
    const payload = {
      deviceID: device.deviceID,
      baud: baudRate,
    } as SerialConnect;
    const request = {
      type: 'serial-connect',
      payload: payload,
    } as FlasherMessage;
    this.setDevice(device);
    this.setConnectionStatus(SERIAL_MONITOR_CONNECTING);
    Flasher.connection?.send(JSON.stringify(request));
  }

  static closeMonitor(deviceID: string) {
    const payload = {
      deviceID: deviceID,
    } as SerialDisconnect;
    const request = {
      type: 'serial-disconnect',
      payload: payload,
    } as FlasherMessage;
    Flasher.connection?.send(JSON.stringify(request));
  }

  static sendMessage(deviceID: string, message: string) {
    const payload = {
      deviceID: deviceID,
      msg: message,
    } as SerialSend;
    const request = {
      type: 'serial-send',
      payload: payload,
    } as FlasherMessage;
    Flasher.connection?.send(JSON.stringify(request));
  }

  static addLog(log: string) {
    this.setLog((prevMessages) => [...prevMessages, log]);
  }

  static changeBaud(deviceID: string, baud: number) {
    const payload = {
      deviceID: deviceID,
      baud: baud,
    } as SerialChangeBaud;
    const request = {
      type: 'serial-change-baud',
      payload: payload,
    } as FlasherMessage;
    Flasher.connection?.send(JSON.stringify(request));
  }
}
