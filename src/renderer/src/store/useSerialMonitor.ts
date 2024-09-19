import { create } from 'zustand';

import { Device } from '@renderer/components/Modules/Device';
import { SERIAL_MONITOR_NO_CONNECTION } from '@renderer/components/Modules/SerialMonitor';

interface SerialMonitorState {
  deviceMessages: string;
  setDeviceMessages: (deviceMessages: string) => void;
  addDeviceMessage: (deviceMessage: string) => void;
  device: Device | undefined;
  setDevice: (currentDevice: Device | undefined) => void;
  connectionStatus: string;
  setConnectionStatus: (connectionStatus: string) => void;
  log: string[];
  setLog: (update: (prevMessages: string[]) => string[]) => void;
}

export const useSerialMonitor = create<SerialMonitorState>((set) => ({
  deviceMessages: '',
  setDeviceMessages: (newDeviceMessage) => set({ deviceMessages: newDeviceMessage }),
  addDeviceMessage: (newMessage) =>
    set((state) => ({ deviceMessages: state.deviceMessages + newMessage })),
  device: undefined,
  setDevice: (newDevice) => set({ device: newDevice }),
  connectionStatus: SERIAL_MONITOR_NO_CONNECTION,
  setConnectionStatus: (newConnectionStatus) => set({ connectionStatus: newConnectionStatus }),
  log: [],
  setLog: (update) => set((value) => ({ log: update(value.log) })),
}));
