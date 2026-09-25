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
      className="h-full [&_.cm-editor]:h-full [&_.cm-editor]:!font-Fira [&_.cm-scroller]:scrollbar-thin [&_.cm-scroller]:scrollbar-track-scrollbar-track [&_.cm-scroller]:scrollbar-thumb-scrollbar-thumb [&_.cm-scroller::-webkit-scrollbar]:!h-[2px] [&_.cm-scroller::-webkit-scrollbar]:!w-[2px]"
      extensions={langExtensions[language]}
      value={initialValue}
      theme={theme ?? 'light'}
      lang={language}
      readOnly={true}
    />
  );
};
