export type SerialMonitorData = {
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

export type SerialMonitorMessage = {
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
