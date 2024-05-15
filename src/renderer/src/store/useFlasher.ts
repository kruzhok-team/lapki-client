import { create } from 'zustand';

interface FlasherState {
  isFlashing: boolean;
  setIsFlashing: (flashing: boolean) => void;
  connectionStatus: string;
  setFlasherConnectionStatus: (newConnectionStatus: string) => void;
}

export const useFlasher = create<FlasherState>((set) => ({
  isFlashing: false,
  setIsFlashing: (newFlashing) => set({ isFlashing: newFlashing }),
  connectionStatus: 'Не подключен.',
  setFlasherConnectionStatus: (newConnectionStatus) =>
    set({ connectionStatus: newConnectionStatus }),
}));
