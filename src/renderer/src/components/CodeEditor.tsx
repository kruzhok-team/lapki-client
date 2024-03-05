import React from 'react';

import { cpp } from '@codemirror/lang-cpp';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import CodeMirror from '@uiw/react-codemirror';

import { useThemeContext } from '@renderer/store/ThemeContext';
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
  const { theme } = useThemeContext();

  return (
    <CodeMirror
      className="h-full [&_.cm-editor]:h-full"
      extensions={langExtensions[language]}
      value={initialValue}
      theme={theme}
      lang={language}
      readOnly={true}
    />
  );
};
