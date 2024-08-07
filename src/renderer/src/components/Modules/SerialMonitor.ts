import {
  Device,
  FlasherMessage,
  SerialConnect,
  SerialDisconnect,
  SerialSend,
} from '@renderer/types/FlasherTypes';

import { Flasher } from './Flasher';

export const SERIAL_MONITOR_CONNECTING = 'Идет подключение...';
export const SERIAL_MONITOR_CONNECTED = 'Подключен';
export const SERIAL_MONITOR_NO_CONNECTION = 'Не подключен';

export class SerialMonitor {
  static setInputValue: (newInputValue: string) => void;
  static addDeviceMessages: (newDeviceMessage: string) => void;
  static setPorts: (prevPorts: string[]) => void;
  static setDevice: (currentDevice: Device | undefined) => void;
  static setConnectionStatus: (connectionStatus: string) => void;
  static setLog: (update: (prevMessages: string[]) => string[]) => void;

  static bindReact(
    setInputValue: (newInputValue: string) => void,
    addMessages: (newDeviceMessage: string) => void,
    setPorts: (prevPorts: string[]) => void,
    setDevice: (currentDevice: Device | undefined) => void,
    setConnectionStatus: (connectionStatus: string) => void,
    setLog: (update: (prevMessages: string[]) => string[]) => void
  ): void {
    this.setInputValue = setInputValue;
    this.addDeviceMessages = addMessages;
    this.setPorts = setPorts;
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
}
