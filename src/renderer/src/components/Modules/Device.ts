export class Device {
  deviceID: string;
  name: string;

  constructor(device: Device) {
    this.deviceID = device.deviceID;
    this.name = device.name;
  }

  isMSDevice(): boolean {
    return this instanceof MSDevice;
  }

  isArduinoDevice(): boolean {
    return this instanceof ArduinoDevice;
  }

  displayName(): string {
    return this.name;
  }

  displaySerialName(): string {
    return this.displayName();
  }
}

export class ArduinoDevice extends Device {
  controller: string;
  programmer: string;
  portName: string;
  serialID: string;

  constructor(device: ArduinoDevice) {
    super(device);
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

  constructor(device: MSDevice) {
    super(device);
    this.portNames = device.portNames;
  }

  displayName(): string {
    return `${this.name} (${this.portNames[0]})`;
  }
  displaySerialName(): string {
    return `${this.name} (${this.portNames[3]})`;
  }
}
