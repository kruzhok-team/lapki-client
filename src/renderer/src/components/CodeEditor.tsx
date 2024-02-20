import React, { useEffect, useRef } from 'react';

import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { useCodeMirror } from '@uiw/react-codemirror';

import { useThemeContext } from '@renderer/store/ThemeContext';
import { Language } from '@renderer/types/tabs';

const extensions = [json(), xml()];

interface CodeEditorProps {
  initialValue: string;
  language: Language;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue, language }) => {
  const { theme } = useThemeContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const { setContainer } = useCodeMirror({
    container: containerRef.current,
    extensions,
    value: initialValue,
    theme,
    height: '100%',
    lang: language,
    readOnly: true,
  });

  useEffect(() => {
    if (containerRef.current) {
      setContainer(containerRef.current);
    }
  }, [setContainer]);

  return <div className="h-full" ref={containerRef} />;
};
