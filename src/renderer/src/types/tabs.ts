export type Language = 'xml' | 'json' | 'txt' | 'cpp';

export interface EditorTab {
  type: 'editor';
  name: 'editor';
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

export type Tab = EditorTab | ScreenTab | CodeTab;
