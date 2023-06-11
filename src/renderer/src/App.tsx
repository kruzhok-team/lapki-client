import React, { useState } from 'react';

import { CodeEditor, DiagramEditor } from './components';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? JSON.parse(fileContent) : null;

  const handleOpenFile = async () => {
    const fileContent = await window.electron.ipcRenderer.invoke('dialog:openFile');

    if (fileContent && typeof fileContent === 'string') {
      setFileContent(fileContent);
    }
  };

  const handleToggleCodeEditor = () => {
    if (!fileContent) {
      return alert('Open JSON File First');
    }

    setIsCodeEditorOpen((p) => !p);
  };

  return (
    <div className="p-4 relative">
      <header className="flex items-center gap-2 mb-2 p-2 sticky top-0 bg-neutral-800 z-20 rounded">
        <button
          className="text-neutral-800 bg-neutral-50 rounded py-2 px-4"
          onClick={handleOpenFile}
        >
          Open File
        </button>
        <button
          className="text-neutral-800 bg-neutral-50 rounded py-2 px-4"
          onClick={handleToggleCodeEditor}
        >
          Toggle Code Editor
        </button>
      </header>

      {elements?.elements && <DiagramEditor elements={elements.elements} />}

      {isCodeEditorOpen && fileContent && <CodeEditor value={fileContent} />}
    </div>
  );
};
