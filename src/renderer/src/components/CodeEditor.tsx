import React from 'react';
import Editor, { loader, EditorProps } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });
loader.init();

interface CodeEditorProps extends EditorProps {}

export const CodeEditor: React.FC<CodeEditorProps> = ({ ...props }) => {
  return <Editor height="100vh" width="16vw" defaultLanguage="JSON" theme="vs-dark" {...props} />;
};
