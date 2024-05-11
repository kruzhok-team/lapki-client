import { create } from 'zustand';

interface FlasherState {
  flashing: boolean;
  setFlashing: (flashing: boolean) => void;
  connectionStatus: string;
  setFlasherConnectionStatus: (newConnectionStatus: string) => void;
}

export const useFlasher = create<FlasherState>((set) => ({
  flashing: false,
  setFlashing: (newFlashing) => set({ flashing: newFlashing }),
  connectionStatus: 'Не подключен.',
  setFlasherConnectionStatus: (newConnectionStatus) =>
    set({ connectionStatus: newConnectionStatus }),
}));
