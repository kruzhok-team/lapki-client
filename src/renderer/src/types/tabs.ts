import { Device } from '@renderer/components/Modules/Device';

import { CompilerResult } from './CompilerTypes';

export type Language = 'xml' | 'json' | 'txt' | 'cpp';

export interface EditorTab {
  type: 'editor';
  name: 'editor';
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
  devices: Map<string, Device>;
  compilerData: CompilerResult | undefined;
}

export type Tab = EditorTab | CodeTab | SerialMonitorTab | ManagerMSTab;
