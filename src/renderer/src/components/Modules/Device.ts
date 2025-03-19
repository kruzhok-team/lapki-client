type devType = 'arduino' | 'tjc-ms' | 'blg-mb' | 'common';

export class Device {
  deviceID: string;
  name: string;
  private type: devType;

  constructor(device: Device, type: devType) {
    this.deviceID = device.deviceID;
    this.name = device.name;
    this.type = type;
  }

  // возможно "isDevice" функции стоит убрать и делать проверку чисто через getDevType

  isMSDevice(): boolean {
    return this.getDevType() === 'tjc-ms';
  }

  isArduinoDevice(): boolean {
    return this.getDevType() === 'arduino';
  }

  displayName(): string {
    return this.name;
  }

  displaySerialName(): string {
    return this.displayName();
  }

  getDevType() {
    return this.type;
  }
}

export class ArduinoDevice extends Device {
  controller: string;
  programmer: string;
  portName: string;
  serialID: string;

  constructor(device: ArduinoDevice) {
    super(device, 'arduino');
    this.controller = device.controller;
    this.programmer = device.programmer;
    this.portName = device.portName;
    this.serialID = device.serialID;
  }

  displayName(): string {
    return `${this.name} (${this.portName})`;
  }
}

export class MSDevice extends Device {
  portNames: string[];
  //address: string | undefined;
  constructor(device: MSDevice) {
    super(device, 'tjc-ms');
    this.portNames = device.portNames;
  }

  displayName(): string {
    return `${this.name} (${this.portNames[0]})`;
  }
  displaySerialName(): string {
    return `${this.name} (${this.portNames[3]})`;
  }
}
