import { OperationType } from '@renderer/types/FlasherTypes';

export type devType = 'arduino' | 'tjc-ms' | 'blg-mb' | 'common';

// TODO: добавить в описания платформ
export const SupportedOperations = new Map<devType, OperationType[]>([
  ['tjc-ms', [OperationType.ping, OperationType.reset, OperationType.meta]],
  ['blg-mb', [OperationType.ping, OperationType.reset]],
]);

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

  isBlgMbDevice(): boolean {
    return this.getDevType() === 'blg-mb';
  }

  displayName(): string {
    return this.name;
  }

  displaySerialName(): string {
    return `${this.name} (${this.getSerialPort() ?? 'Порт не найден'})`;
  }

  getDevType() {
    return this.type;
  }

  getSerialPort(): string | null {
    return null;
  }

  isOperationSupported(op: OperationType): boolean {
    return SupportedOperations.get(this.type)?.includes(op) ?? false;
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

  getSerialPort(): string | null {
    return this.portName;
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

  getSerialPort(): string | null {
    return this.portNames[3];
  }
}
