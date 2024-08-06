import {
  Device,
  FlasherMessage,
  SerialConnect,
  SerialDisconnect,
} from '@renderer/types/FlasherTypes';

import { Flasher } from './Flasher';

export const SERIAL_MONITOR_CONNECTING = 'Идет подключение...';
export const SERIAL_MONITOR_CONNECTED = 'Подключен';
export const SERIAL_MONITOR_NO_CONNECTION = 'Не подключен';

export class SerialMonitor {
  static autoScroll: boolean;
  static setInputValue: (newInputValue: string) => void;
  static messages: string[];
  static setMessages: (update: (prevMessages: string[]) => string[]) => void;
  static ports: string[];
  static setPorts: (prevPorts: string[]) => void;
  static device: Device | undefined;
  static setDevice: (currentDevice: Device | undefined) => void;
  static connectionStatus: string;
  static setConnectionStatus: (connectionStatus: string) => void;

  static bindReact(
    autoScroll: boolean,
    setInputValue: (newInputValue: string) => void,
    messages: string[],
    setMessages: (update: (prevMessages: string[]) => string[]) => void,
    ports: string[],
    setPorts: (prevPorts: string[]) => void,
    device: Device | undefined,
    setDevice: (currentDevice: Device | undefined) => void,
    connectionStatus: string,
    setConnectionStatus: (connectionStatus: string) => void
  ): void {
    this.autoScroll = autoScroll;
    this.setInputValue = setInputValue;
    this.messages = messages;
    this.setMessages = setMessages;
    this.ports = ports;
    this.setPorts = setPorts;
    this.device = device;
    this.setDevice = setDevice;
    this.connectionStatus = connectionStatus;
    this.setConnectionStatus = setConnectionStatus;
  }

  //Функция для формирования сообщения
  static message(message) {
    this.setMessages((prevMessages) => [...prevMessages, message]);
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

  static getDeviceName(): string {
    return `${this.device?.name} (${this.device?.portName})`;
  }
}
