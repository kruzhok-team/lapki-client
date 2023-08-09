export type FlasherData = {
  devices: Map<string, Device>,
  currentDevice: string,
  log: string
}

export type FlashStart = {
  deviceID: string,
  fileSize: number
}

export type FlasherMessage = {
  type: string,
  payload: string | Device | FlashStart | undefined 
}

export type Device = {
  deviceID: string,
  name: string,
  controller: string,
  programmer: string,
  portName: string,
  serialID: string
}