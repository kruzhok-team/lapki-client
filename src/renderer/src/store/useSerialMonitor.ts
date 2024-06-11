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
}

export const useSerialMonitor = create<SerialMonitorState>((set) => ({
  autoScroll: true,
  setAutoScroll: (newSerialMonitor) => set({ autoScroll: newSerialMonitor }),
  inputValue: '',
  setInputValue: (newInputValue) => set({ inputValue: newInputValue }),
  messages: [],
  setMessages: (update) => set((state) => ({ messages: update(state.messages) })),
  connectionStatus: 'Не подключен.',
  setConnectionStatus: (newConnectionStatus) => set({ connectionStatus: newConnectionStatus }),
}));
