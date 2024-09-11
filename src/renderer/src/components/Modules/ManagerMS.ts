import { Device } from '@renderer/types/FlasherTypes';

import { Flasher } from './Flasher';

export class ManagerMS {
  static binStart(deviceID: string, fileSize: number, address: string) {
    Flasher.send('ms-bin-start', {
      deviceID: deviceID,
      fileSize: fileSize,
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
}
