import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { DiagramEditor, Documentations, Tabs } from './components';
import { Elements } from './types/diagram';

/*Первые иконки*/
import arrow from './img/arrow.png';
import forward from './img/forward.png';
/*Вторичные иконки*/

import arrow1 from './img/arrow1.png';
import { Sidebar } from './components/Sidebar';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;

  const [isDocOpen, setIsDocOpen] = useState(false);

  /*Открытие файла*/
  const handleOpenFile = async () => {
    const fileContent = await window.electron.ipcRenderer.invoke('dialog:openFile');
    if (fileContent && typeof fileContent === 'string') {
      setFileContent(fileContent);
    }
  };

  const handleToggleCodeEditor = () => {
    if (!fileContent) {
      return alert('Сначала откройте файл JSON');
    }

    setIsCodeEditorOpen((p) => !p);
  };

  return (
    <div className="flex">
      <Sidebar fileContent={fileContent} onRequestOpenFile={handleOpenFile} />

      <div className="flex-1">
        {elements ? (
          <>
            <div className="flex h-[2rem] items-center justify-between border-b border-[#4391BF]">
              <Tabs />
              <button className="w-[4vw]">
                <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
              </button>
            </div>

            <div className="relative flex h-[calc(100vh-2rem)] w-full">
              <DiagramEditor elements={elements} />

              <div className="absolute bottom-0 right-0 top-0 flex">
                <button
                  className="grid h-full w-10 place-items-center"
                  onClick={() => setIsDocOpen((p) => !p)}
                >
                  <img src={isDocOpen ? arrow1 : arrow} alt="" />
                </button>

                <div className={twMerge('h-full w-96 transition-all', !isDocOpen && 'hidden')}>
                  <Documentations />
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="pt-24 text-center font-Fira text-base">
            Откройте файл или перенесите его сюда...
          </p>
        )}
      </div>
    </div>
  );
};
