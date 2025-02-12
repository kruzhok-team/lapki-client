import React from 'react';

import { cpp } from '@codemirror/lang-cpp';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import CodeMirror from '@uiw/react-codemirror';

import { useSettings } from '@renderer/hooks';
import { Language } from '@renderer/types/tabs';

// (bryzZz) Почему-то нельзя просто передать массив языков, будет работать только первый
// А так работает
const langExtensions = {
  cpp: cpp(),
  xml: xml(),
  json: json(),
};

interface CodeEditorProps {
  initialValue: string;
  language: Language;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue, language }) => {
  const [theme] = useSettings('theme');

  return (
    <CodeMirror
      className="h-full scrollbar-thin scrollbar-track-current [&_.cm-editor]:h-full"
      extensions={langExtensions[language]}
      value={initialValue}
      theme={theme ?? 'light'}
      lang={language}
      readOnly={true}
    />
  );
};
