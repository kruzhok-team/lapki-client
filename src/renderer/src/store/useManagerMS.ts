import { create } from 'zustand';

import { MSDevice } from '@renderer/components/Modules/Device';
import { MetaDataID } from '@renderer/types/FlasherTypes';

interface ManagerMSState {
  device: MSDevice | undefined;
  setDevice: (currentDevice: MSDevice | undefined) => void;
  log: string[];
  setLog: (update: (prevMessages: string[]) => string[]) => void;
  address: string;
  setAddress: (curAddress: string) => void;
  meta: MetaDataID | undefined;
  setMeta: (curMeta: MetaDataID | undefined) => void;
}

export const useManagerMS = create<ManagerMSState>((set) => ({
  device: undefined,
  setDevice: (newDevice) => set({ device: newDevice }),
  log: [],
  setLog: (update) => set((value) => ({ log: update(value.log) })),
  address: '',
  setAddress: (newAddress) => set({ address: newAddress }),
  meta: undefined,
  setMeta: (newMeta) => set({ meta: newMeta }),
}));
