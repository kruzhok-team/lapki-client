import { Device, FlasherMessage, SerialConnect } from '@renderer/types/FlasherTypes';

import { Flasher } from './Flasher';

export class SerialMonitor {
  static autoScroll: boolean;
  static setInputValue: (newInputValue: string) => void;
  static messages: string[];
  static setMessages: (update: (prevMessages: string[]) => string[]) => void;
  static ports: string[];
  static setPorts: (prevPorts: string[]) => void;
  static setDevice: (currentDevice: Device | undefined) => void;

  static bindReact(
    autoScroll: boolean,
    setInputValue: (newInputValue: string) => void,
    messages: string[],
    setMessages: (update: (prevMessages: string[]) => string[]) => void,
    ports: string[],
    setPorts: (prevPorts: string[]) => void,
    setDevice: (currentDevice: Device | undefined) => void
  ): void {
    this.autoScroll = autoScroll;
    this.setInputValue = setInputValue;
    this.messages = messages;
    this.setMessages = setMessages;
    this.ports = ports;
    this.setPorts = setPorts;
    this.setDevice = setDevice;
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
    Flasher.connection?.send(JSON.stringify(request));
  }
}
