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

  static sendMessage(deviceID: string, message: string) {
    Flasher.send('serial-send', {
      deviceID: deviceID,
      msg: message,
    });
  }

  static addLog(log: string) {
    this.setLog((prevMessages) => [...prevMessages, log]);
  }

  static changeBaud(deviceID: string, baud: number) {
    Flasher.send('serial-change-baud', {
      deviceID: deviceID,
      baud: baud,
    });
  }
}
