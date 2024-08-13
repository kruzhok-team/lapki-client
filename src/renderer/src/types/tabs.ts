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

export type Tab = EditorTab | CodeTab | SerialMonitorTab;
