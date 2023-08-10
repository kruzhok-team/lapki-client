export type FlasherData = {
  devices: Map<string, Device>,
  log: string | undefined,
  connectionStatus: string,
}

export type FlashStart = {
  deviceID: string,
  fileSize: number
}

export type FlashUpdatePort = {
  deviceID: string,
  portName: string
}

export type FlasherMessage = {
  type: string,
  payload: string | Device | FlashStart | UpdateDelete | undefined 
}

export type UpdateDelete = {
  deviceID: string
}

export type Device = {
  deviceID: string,
  name: string,
  controller: string,
  programmer: string,
  portName: string,
  serialID: string
}