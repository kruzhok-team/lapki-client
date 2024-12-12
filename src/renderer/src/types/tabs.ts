import { SelectedMsFirmwaresType } from './FlasherTypes';

export type Language = 'xml' | 'json' | 'txt' | 'cpp';

export interface EditorTab {
  canvasId: string;
  type: 'editor';
  name: string;
}

export interface CodeTab {
  type: 'code' | 'transition' | 'state';
  name: string;
  language: Language;
  code: string;
}

export interface SerialMonitorTab {
  type: 'serialMonitor';
  name: string;
}

export interface ManagerMSTab {
  type: 'managerMS';
  name: string;
  sendBins: (firmwares: SelectedMsFirmwaresType[], verification: boolean) => void;
  hasCompileData: (stateMachineId: string) => boolean;
}

export type Tab = EditorTab | CodeTab | SerialMonitorTab | ManagerMSTab;
