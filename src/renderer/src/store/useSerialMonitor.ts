import { create } from 'zustand';

interface SerialMonitorState {
  autoScroll: boolean;
  setAutoScroll: (autoScroll: boolean) => void;
  inputValue: string;
  setInputValue: (newInputValue: string) => void;
  messages: string[];
  setMessages: (update: (prevMessages: string[]) => string[]) => void;
  ports: string[];
  setPorts: (prevPorts: string[]) => void;
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
}));
