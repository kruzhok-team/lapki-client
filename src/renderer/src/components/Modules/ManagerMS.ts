import { MetaDataID } from '@renderer/types/FlasherTypes';

import { Device, MSDevice } from './Device';
import { Flasher } from './Flasher';

export class ManagerMS {
  static setDevice: (currentDevice: MSDevice | undefined) => void;
  static setLog: (update: (prevMessages: string[]) => string[]) => void;
  static setAddress: (curAddress: string) => void;
  static setMeta: (curMeta: MetaDataID) => void;

  static bindReact(
    setDevice: (currentDevice: MSDevice | undefined) => void,
    setLog: (update: (prevMessages: string[]) => string[]) => void,
    setAddress: (curAddress: string) => void,
    setMeta: (curMeta: MetaDataID) => void
  ): void {
    this.setDevice = setDevice;
    this.setLog = setLog;
    this.setAddress = setAddress;
    this.setMeta = setMeta;
  }
  static binStart(
    device: MSDevice,
    address: string,
    verification: boolean = false,
    serialMonitorDevice: Device | undefined = undefined,
    serialConnectionStatus: string = ''
  ) {
    Flasher.flashPreparation(device, serialMonitorDevice, serialConnectionStatus);
    Flasher.send('ms-bin-start', {
      deviceID: device.deviceID,
      fileSize: Flasher.binary.size,
      address: address,
      verification: verification,
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
  static addLog(log: string) {
    this.setLog((prevMessages) => [...prevMessages, log]);
  }
  static reset(deviceID: string, address: string) {
    Flasher.send('ms-reset', {
      deviceID: deviceID,
      address: address,
    });
  }
  static getMetaData(deviceID: string, address: string) {
    Flasher.send('ms-get-meta-data', {
      deviceID: deviceID,
      address: address,
    });
  }
}
