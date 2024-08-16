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
  | 'serial-log'
  | 'serial-connect'
  | 'serial-connection-status'
  | 'serial-disconnect'
  | 'serial-send'
  | 'serial-sent-status'
  | 'serial-device-read'
  | 'serial-change-baud';
export type FlasherPayload =
  | string
  | Device
  | FlashStart
  | UpdateDelete
  | undefined
  | SerialStatus
  | SerialConnect
  | SerialRead
  | SerialDisconnect
  | SerialSend
  | SerialChangeBaud;
export type FlasherMessage = {
  type: FlasherType;
  payload: FlasherPayload;
};

export type UpdateDelete = {
  deviceID: string;
};

export type Device = {
  deviceID: string;
  name: string;
  controller: string;
  programmer: string;
  portName: string;
  serialID: string;
};

/**
 * результат попытки прошить устройство
 */
export class FlashResult {
  /** название устройства, которое прошилось или должно было прошиться*/
  private device: Device | undefined;
  /** результат обработки запроса*/
  private result: string | undefined;
  /** сообщение от avrdude*/
  private avrdudeMsg: string | undefined;
  constructor(
    device: Device | undefined,
    result: string | undefined,
    avrdudeMsg: string | undefined
  ) {
    this.device = device;
    this.result = result;
    this.avrdudeMsg = avrdudeMsg;
  }
  /** получить результат прошивки*/
  public report(): string {
    const deviceDesc = this.device ? `${this.device.name} (${this.device.portName})` : 'неизвестно';
    const serialID = this.device?.serialID ? this.device?.serialID : 'отсутствует';
    const avrdudeMsg = this.avrdudeMsg ? this.avrdudeMsg : 'отсутствует сообщение';
    return `
Устройство: ${deviceDesc}
Серийный номер устройства: ${serialID}
Результат прошивки: "${this.result}"

Вывод avrdude 
${avrdudeMsg}`;
  }
}

export type SerialStatus = {
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
