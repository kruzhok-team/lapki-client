import { create } from 'zustand';

import { Device } from '@renderer/components/Modules/Device';
import { ClientStatus } from '@renderer/components/Modules/Websocket/ClientStatus';
import { FlasherMessage, FlashResult, FlashTableItem } from '@renderer/types/FlasherTypes';

// TODO: объединить с useManagerMS
interface FlasherState {
  isFlashing: boolean;
  setIsFlashing: (flashing: boolean) => void;
  connectionStatus: string;
  setConnectionStatus: (newConnectionStatus: string) => void;
  // log: string[];
  // setLog: (update: (prevMessages: string[]) => string[]) => void;
  devices: Map<string, Device>;
  setDevices: (newDevices: Map<string, Device>) => void;
  /**
   * секунд до переподключения, null - означает, что отчёт до переподключения не ведётся
   */
  secondsUntilReconnect: number | null;
  setSecondsUntilReconnect: (newSeconds: number | null) => void;
  flasherMessage: FlasherMessage | null;
  setFlasherMessage: (newMsg: FlasherMessage) => void;
  /**
   *  сообщение о результате последней попытки прошить устройство,
   *  если информации о последней прошивки нет, то равняется undefined
   */
  flashResult: Map<string, FlashResult>;
  setFlashResult: (newFlashResult: Map<string, FlashResult>) => void;
  errorMessage: string | undefined;
  setErrorMessage: (newError: string | undefined) => void;
  flashTableData: FlashTableItem[];
  setFlashTableData: (newFlashTableData: FlashTableItem[]) => void;
  hasAvrdude: boolean;
  setHasAvrdude: (newHasAvrdude: boolean) => void;
  binaryFolder: string | null;
  setBinaryFolder: (newBinaryFolder: string | null) => void;
}

export const useFlasher = create<FlasherState>((set) => ({
  isFlashing: false,
  setIsFlashing: (newFlashing) => set({ isFlashing: newFlashing }),
  connectionStatus: ClientStatus.NO_CONNECTION,
  setConnectionStatus: (newConnectionStatus) => set({ connectionStatus: newConnectionStatus }),
  // log: [],
  // setLog: (update) => set((value) => ({ log: update(value.log) })),
  devices: new Map(),
  setDevices: (newDevices: Map<string, Device>) => set({ devices: newDevices }),
  secondsUntilReconnect: null,
  setSecondsUntilReconnect: (newSeconds: number | null) =>
    set({ secondsUntilReconnect: newSeconds }),
  flasherMessage: null,
  setFlasherMessage: (newMsg: FlasherMessage) => set({ flasherMessage: newMsg }),
  flashResult: new Map(),
  setFlashResult: (newFlashResult: Map<string, FlashResult>) =>
    set({ flashResult: newFlashResult }),
  errorMessage: undefined,
  setErrorMessage: (newError: string | undefined) => set({ errorMessage: newError }),
  flashTableData: [],
  setFlashTableData: (newFlashTableData: FlashTableItem[]) =>
    set({ flashTableData: newFlashTableData }),
  hasAvrdude: false,
  setHasAvrdude: (newHasAvrdude: boolean) => set({ hasAvrdude: newHasAvrdude }),
  binaryFolder: null,
  setBinaryFolder: (newBinaryFolder: string | null) => set({ binaryFolder: newBinaryFolder }),
}));
