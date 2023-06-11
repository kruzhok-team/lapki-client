import React from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import { Versions } from './components/Versions';

loader.config({ monaco });
loader.init();

export const App: React.FC = () => {
  const handleClick = async () => {
    const fileContent = await window.electron.ipcRenderer.invoke('dialog:openFile');

    console.log(fileContent);
  };

  return (
    <>
      <Editor
        height="90vh"
        defaultLanguage="typescript"
        defaultValue="const a = 12;"
        theme="vs-dark"
      />
      <button onClick={handleClick}>Click to choose file</button>
      <Versions />
    </>
  );
};
