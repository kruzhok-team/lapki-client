import React, { useState } from 'react';
import { CodeEditor, DiagramEditor } from './components';
import { Elements } from './types/diagram';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;

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
    <div className="h-screen bg-neutral-800">
      <header className="flex h-14 items-center gap-2 border-b border-neutral-500 bg-neutral-700 p-2">
        <button
          className="rounded-sm bg-neutral-50 px-2 py-1 text-neutral-800"
          onClick={handleOpenFile}
        >
          Open File
        </button>
        <button
          className="rounded-sm bg-neutral-50 px-2 py-1 text-neutral-800"
          onClick={handleToggleCodeEditor}
        >
          Toggle Code Editor
        </button>
      </header>

      <main className="h-[calc(100vh-3.5rem)]">
        {elements && <DiagramEditor elements={elements} />}

        {isCodeEditorOpen && fileContent && <CodeEditor value={fileContent} />}
      </main>
    </div>
  );
};
