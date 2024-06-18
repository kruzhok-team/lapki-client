import { create } from 'zustand';

interface SerialMonitorState {
  autoScroll: boolean;
  setAutoScroll: (autoScroll: boolean) => void;
  inputValue: string;
  setInputValue: (newInputValue: string) => void;
  messages: string[];
  setMessages: (update: (prevMessages: string[]) => string[]) => void;
  connectionStatus: string;
  setConnectionStatus: (newConnectionStatus: string) => void;
  devices: string[];
  setDevices: (prevPorts: string[]) => void;
}

export const useSerialMonitor = create<SerialMonitorState>((set) => ({
  autoScroll: true,
  setAutoScroll: (newSerialMonitor) => set({ autoScroll: newSerialMonitor }),
  inputValue: '',
  setInputValue: (newInputValue) => set({ inputValue: newInputValue }),
  messages: [],
  setMessages: (update) => set((value) => ({ messages: update(value.messages) })),
  connectionStatus: 'Не подключен.',
  setConnectionStatus: (newConnectionStatus) => set({ connectionStatus: newConnectionStatus }),
  devices: [],
  setDevices: (value) => set({ devices: value }),
}));
