import { create } from 'zustand';

import { SERIAL_MONITOR_NO_CONNECTION } from '@renderer/components/Modules/SerialMonitor';
import { Device } from '@renderer/types/FlasherTypes';

interface SerialMonitorState {
  autoScroll: boolean;
  setAutoScroll: (autoScroll: boolean) => void;
  inputValue: string;
  setInputValue: (newInputValue: string) => void;
  messages: string[];
  setMessages: (update: (prevMessages: string[]) => string[]) => void;
  ports: string[];
  setPorts: (prevPorts: string[]) => void;
  device: Device | undefined;
  setDevice: (currentDevice: Device | undefined) => void;
  connectionStatus: string;
  setConnectionStatus: (connectionStatus: string) => void;
}

export const useSerialMonitor = create<SerialMonitorState>((set) => ({
  autoScroll: true,
  setAutoScroll: (newSerialMonitor) => set({ autoScroll: newSerialMonitor }),
  inputValue: '',
  setInputValue: (newInputValue) => set({ inputValue: newInputValue }),
  messages: [],
  setMessages: (update) => set((value) => ({ messages: update(value.messages) })),
  ports: [],
  setPorts: (value) => set({ ports: value }),
  device: undefined,
  setDevice: (newDevice) => set({ device: newDevice }),
  connectionStatus: SERIAL_MONITOR_NO_CONNECTION,
  setConnectionStatus: (newConnectionStatus) => set({ connectionStatus: newConnectionStatus }),
}));
