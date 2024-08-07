import { create } from 'zustand';

import { SERIAL_MONITOR_NO_CONNECTION } from '@renderer/components/Modules/SerialMonitor';
import { Device } from '@renderer/types/FlasherTypes';

interface SerialMonitorState {
  autoScroll: boolean;
  setAutoScroll: (autoScroll: boolean) => void;
  inputValue: string;
  setInputValue: (newInputValue: string) => void;
  deviceMessages: string[];
  setDeviceMessages: (update: (prevMessages: string[]) => string[]) => void;
  ports: string[];
  setPorts: (prevPorts: string[]) => void;
  device: Device | undefined;
  setDevice: (currentDevice: Device | undefined) => void;
  connectionStatus: string;
  setConnectionStatus: (connectionStatus: string) => void;
  log: string[];
  setLog: (update: (prevMessages: string[]) => string[]) => void;
}

export const useSerialMonitor = create<SerialMonitorState>((set) => ({
  autoScroll: true,
  setAutoScroll: (newSerialMonitor) => set({ autoScroll: newSerialMonitor }),
  inputValue: '',
  setInputValue: (newInputValue) => set({ inputValue: newInputValue }),
  deviceMessages: [],
  setDeviceMessages: (update) => set((value) => ({ deviceMessages: update(value.deviceMessages) })),
  ports: [],
  setPorts: (value) => set({ ports: value }),
  device: undefined,
  setDevice: (newDevice) => set({ device: newDevice }),
  connectionStatus: SERIAL_MONITOR_NO_CONNECTION,
  setConnectionStatus: (newConnectionStatus) => set({ connectionStatus: newConnectionStatus }),
  log: [],
  setLog: (update) => set((value) => ({ log: update(value.log) })),
}));
