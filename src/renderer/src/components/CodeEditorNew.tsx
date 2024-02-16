import React, { useLayoutEffect, useState } from 'react';

import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

interface CodeEditorProps {
  initialValue: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue }) => {
  const [value, setValue] = useState('');

  useLayoutEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <CodeMirror
      value={value}
      className="h-full"
      height="100%"
      theme="dark"
      extensions={[json()]}
      onChange={setValue}
    />
  );
};
