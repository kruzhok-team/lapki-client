import { Device } from '@renderer/types/FlasherTypes';

import { Flasher } from './Flasher';

export class ManagerMS {
  static setDevice: (currentDevice: Device | undefined) => void;
  static setLog: (update: (prevMessages: string[]) => string[]) => void;

  static bindReact(
    setDevice: (currentDevice: Device | undefined) => void,
    setLog: (update: (prevMessages: string[]) => string[]) => void
  ): void {
    this.setDevice = setDevice;
    this.setLog = setLog;
  }
  static binStart(
    device: Device,
    address: string,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ) {
    Flasher.flashPreparation(device, serialMonitorDevice, serialConnectionStatus);
    Flasher.send('ms-bin-start', {
      deviceID: device.deviceID,
      fileSize: Flasher.binary.size,
      address: address,
    });
  }
  static ping(deviceID: string, address: string) {
    Flasher.send('ms-ping', {
      deviceID: deviceID,
      address: address,
    });
  }
  static getAddress(deviceID: string) {
    Flasher.send('ms-get-address', {
      deviceID: deviceID,
    });
  }
  static isMSDevice(device: Device) {
    // TODO: придумать более надёжный способ идентификации МС-ТЮК
    return device.name == 'МС-ТЮК';
  }
  static addLog(log: string) {
    this.setLog((prevMessages) => [...prevMessages, log]);
  }
}
