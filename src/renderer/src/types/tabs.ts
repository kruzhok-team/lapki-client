export type Language = 'xml' | 'json' | 'txt' | 'cpp';

export interface EditorTab {
  canvasId: string;
  type: 'editor';
  name: string;
}

export interface ScreenTab {
  type: 'scheme';
  name: 'scheme';
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

export type Tab = EditorTab | CodeTab | ScreenTab | SerialMonitorTab;
