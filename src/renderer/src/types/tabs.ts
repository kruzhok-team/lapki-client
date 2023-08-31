export interface EditorTab {
  type: 'editor';
  name: 'editor';
}

export interface CodeTab {
  type: 'code' | 'transition' | 'state';
  name: string;
  language: string;
  code: string;
}

export type Tab = EditorTab | CodeTab;
