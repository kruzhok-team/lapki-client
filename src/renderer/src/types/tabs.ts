export type Language = 'xml' | 'json' | 'txt';

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

export type Tab = EditorTab | CodeTab;
