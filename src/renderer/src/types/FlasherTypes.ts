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

export type FlasherMessage = {
  type: string;
  payload: string | Device | FlashStart | UpdateDelete | undefined;
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
