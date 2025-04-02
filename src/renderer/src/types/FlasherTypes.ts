import { ArduinoDevice, Device, MSDevice } from '@renderer/components/Modules/Device';

import { Binary } from './CompilerTypes';

export type FlasherData = {
  devices: Map<string, Device>;
  log: string | undefined;
  connectionStatus: string;
};

export type FlashStart = {
  deviceID: string;
  fileSize: number;
};

export type FlashUpdatePort = {
  deviceID: string;
  portName: string;
};

export type FlasherType =
  | 'get-list'
  | 'device'
  | 'device-update-delete'
  | 'device-update-port'
  | 'empty-list'
  | 'flash-start'
  | 'flash-next-block'
  | 'flash-done'
  | 'get-max-file-size'
  | 'max-file-size'
  | 'flash-wrong-id'
  | 'flash-disconnected'
  | 'flash-avrdude-error'
  | 'flash-not-finished'
  | 'flash-not-started'
  | 'flash-blocked'
  | 'flash-large-file'
  | 'event-not-supported'
  | 'unmarshal-err'
  | 'get-list-cooldown'
  | 'flash-not-supported'
  | 'flash-open-serial-monitor'
  | 'flash-backtrack-ms'
  | 'serial-log'
  | 'serial-connect'
  | 'serial-connection-status'
  | 'serial-disconnect'
  | 'serial-send'
  | 'serial-sent-status'
  | 'serial-device-read'
  | 'serial-change-baud'
  | 'ms-bin-start'
  | 'ms-ping'
  | 'ms-get-address'
  | 'ms-ping-result'
  | 'ms-address'
  | 'ms-device'
  | 'ms-reset'
  | 'ms-reset-result'
  | 'ms-get-meta-data'
  | 'ms-meta-data'
  | 'ms-meta-data-error'
  | 'ms-get-address-and-meta'
  | 'ms-address-and-meta'
  | 'ms-get-firmware'
  | 'ms-get-firmware-approve'
  | 'ms-get-firmware-next-block'
  | 'ms-get-firmware-finish'
  | 'binary-data';
export type FlasherPayload =
  | null
  | string
  | Uint8Array
  | Device
  | FlashStart
  | UpdateDelete
  | undefined
  | DeviceCommentCode
  | SerialConnect
  | SerialRead
  | SerialDisconnect
  | SerialSend
  | SerialChangeBaud
  | MSBinStart
  | MSGetAddress
  | MSAddressAction
  | MetaData
  | FlashBacktrackMs
  | MSAddressAndMeta
  | MSGetFirmware;
export type FlasherMessage = {
  type: FlasherType;
  payload: FlasherPayload;
};

export type UpdateDelete = {
  deviceID: string;
};

/**
 * результат попытки прошить устройство
 */
export class FlashResult {
  /** название устройства, которое прошилось или должно было прошиться*/
  private device: Device | undefined;
  /** результат обработки запроса*/
  private result: string | undefined;
  /** сообщение от программы для прошивки (например, avrdude)*/
  private flashMsg: string | undefined;

  /** Для МС-ТЮК*/
  private addressInfo: AddressData | undefined;
  constructor(
    device: Device | undefined,
    result: string | undefined,
    flashMsg: string | undefined,
    addressInfo: AddressData | undefined
  ) {
    this.device = device;
    this.result = result;
    this.flashMsg = flashMsg;
    this.addressInfo = addressInfo;
  }
  /** получить результат прошивки*/
  public report(): string {
    const deviceDesc = this.device ? this.device.displayName() : 'неизвестно';
    const serialID =
      this.device && (this.device as ArduinoDevice).serialID
        ? (this.device as ArduinoDevice).serialID
        : 'отсутствует';
    const avrdudeMsg = this.flashMsg ? this.flashMsg : 'отсутствует сообщение';
    const addressInfoDisplay = (addressInfo: AddressData | undefined) => {
      if (addressInfo === undefined) {
        return '';
      }
      const name = `Название: ${addressInfo.name}`;
      const address = `Адрес: ${addressInfo.address}`;
      const type = addressInfo ? `Тип: ${addressInfo.type}` : '';
      return `Информация о плате:\n ${name}\n ${address}\n ${type}`;
    };
    return `
Устройство: ${deviceDesc}
Серийный номер устройства: ${serialID}
${addressInfoDisplay(this.addressInfo)}
Результат прошивки: "${this.result}"

Вывод программы для загрузки прошивки:
${avrdudeMsg}`;
  }
}

export type DeviceCommentCode = {
  deviceID: string;
  code: number;
  comment: string;
};

export type SerialConnect = {
  deviceID: string;
  baud: number;
};

export type SerialRead = {
  deviceID: string;
  msg: string;
};

export type SerialDisconnect = {
  deviceID: string;
};

export type SerialSend = {
  deviceID: string;
  msg: string;
};

export type SerialChangeBaud = {
  deviceID: string;
  baud: number;
};

export type MSBinStart = {
  deviceID: string;
  fileSize: number;
  address: string;
  verification: boolean;
};

export type MSAddressAction = {
  deviceID: string;
  address: string;
};

export type MSGetAddress = {
  deviceID: string;
};

export type MetaData = {
  RefBlHw: string; // Описывает физическое окружение контроллера (плату)
  RefBlFw: string; // Указывает на версию прошивки загрузчика
  RefBlUserCode: string; //
  RefBlChip: string; // Указывает на контроллер, здесь то, что нужно для компиляции прошивки
  RefBlProtocol: string; // Описывает возможности протокола загрузчика
  RefCgHw: string; // Указывает на аппаратное исполнение
  RefCgFw: string; // Указывает на версию прошивки кибергена
  RefCgProtocol: string; // Указывает на возможности протокола кибергена
};

// адрес и ассоциированные с ним данные (для МС-ТЮК)
export type AddressData = {
  name: string;
  address: string;
  type: string;
  meta: MetaData | undefined;
};

// метаданные с deviceID
export type MetaDataID = {
  deviceID: string;
  meta: MetaData;
  type: string; // тип устройства (определяется по RefBlHw)
};

export enum FirmwareTargetType {
  tjc_ms,
  arduino,
}

// выбранные для прошивки МС-ТЮК платы
export type FirmwaresType = {
  target: number;
  targetType: FirmwareTargetType;
  isFile: boolean;
};

export type FlashTableItem = {
  isSelected: boolean;
  targetId: number | string;
  targetType: FirmwareTargetType;
  source?: string; // id машины состояний или путь к файлу
  isFile: boolean;
};

export type BinariesQueueItem = {
  device: Device;
  addressInfo: AddressData | undefined;
  verification: boolean;
  binaries: Array<Binary> | Blob;
  isFile: boolean;
};

export type FlashBacktrackMs = {
  UploadStage: string;
  NoPacks: boolean;
  CurPack: number;
  TotalPacks: number;
};

export enum OperationType {
  ping,
  reset,
  meta,
}

export type OperationInfo = {
  type: OperationType;
  addressInfo: AddressData;
  deviceId: string;
};

export type MSAddressAndMeta = {
  deviceID: string;
  address: string;
  type: string;
  errorMsg: string;
  errorCode: number;
  meta: MetaData;
};

export type AddressAndMeta = {
  deviceID: string;
  address?: string;
  type?: string;
  meta?: MetaData;
};

export type MSGetFirmware = {
  deviceID: string;
  address: string;
  blockSize: number;
  RefBlChip: string; // не обязательный параметр из метаданных, можно оставить пустым, если значение неизвестно.
};

export type MSOperationReport = {
  deviceID: string;
  address: string;
  code: number;
  comment: string;
};

export type GetFirmwareQueueItem = {
  dev: MSDevice;
  addressInfo: AddressData;
  blockSize: number;
};
