import React, { useState } from 'react';

import { CodeEditor, DiagramEditor, Versions } from './components';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);

  const handleOpenFile = async () => {
    const fileContent = await window.electron.ipcRenderer.invoke('dialog:openFile');

    if (fileContent && typeof fileContent === 'string') {
      setFileContent(fileContent);
    }
  };

  const handleOpenCodeEditor = () => {
    if (!fileContent) {
      return alert('Open JSON File First');
    }

    setIsCodeEditorOpen(true);
  };

  return (
    <div>
      <button onClick={handleOpenFile}>Open File</button>
      <button onClick={handleOpenCodeEditor}>Open In Code Editor</button>
      {isCodeEditorOpen && fileContent && <CodeEditor value={fileContent} />}
      {fileContent && <DiagramEditor fileContent={fileContent} />}
      <Versions />
    </div>
  );
};
