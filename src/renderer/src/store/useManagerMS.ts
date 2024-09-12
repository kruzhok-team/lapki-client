import { create } from 'zustand';

import { Device } from '@renderer/types/FlasherTypes';

interface ManagerMSState {
  device: Device | undefined;
  setDevice: (currentDevice: Device | undefined) => void;
  log: string[];
  setLog: (update: (prevMessages: string[]) => string[]) => void;
}

export const useManagerMS = create<ManagerMSState>((set) => ({
  device: undefined,
  setDevice: (newDevice) => set({ device: newDevice }),
  log: [],
  setLog: (update) => set((value) => ({ log: update(value.log) })),
}));
