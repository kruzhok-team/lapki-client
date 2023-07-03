import React, { useState } from 'react';

import { DiagramEditor, Documentations, Tabs } from './components';
import { Elements } from './types/diagram';
import { Sidebar } from './components/Sidebar';

/*Первые иконки*/
import arrow from './assets/img/arrow.png';
/*Вторичные иконки*/
import arrow1 from './assets/img/arrow1.png';

export const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;

  /*Переключение блоков в меню между собой*/
  const [activeIndexDoc, setActiveIndexDoc] = useState(0);
  const handleClickDoc = (index) => setActiveIndexDoc(index);
  const checkActiveDoc = (index, className) => (activeIndexDoc === index ? className : '');

  /*Открытие файла*/
  const handleOpenFile = async () => {
    const fileContent = await window.electron.ipcRenderer.invoke('dialog:openFile');
    if (fileContent && typeof fileContent === 'string') {
      setFileContent(fileContent);
    }
  };

  /*Вывод сообщения перед открытием редактора кода*/
  const handleToggleCodeEditor = () => {
    if (!fileContent) {
      return alert('Сначала откройте файл JSON');
    }

    setIsCodeEditorOpen((p) => !p);
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar fileContent={fileContent} onRequestOpenFile={handleOpenFile} />

      <div className="flex w-full flex-col">
        {/* Tabs */}
        <div className="flex min-h-[2rem] items-center">
          {elements && <Tabs />}
          {/* <button className="w-[4vw]">
            <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
          </button> */}
        </div>

        <main className="min-h-[calc(100vh-2rem)] w-full">
          {elements ? (
            <DiagramEditor elements={elements} />
          ) : (
            <div className="pt-25 w-full">
              <p className="text-center font-Fira text-base">
                Откройте файл или перенесите его сюда...
              </p>
            </div>
          )}
        </main>
      </div>

      <section className="flex w-[3rem] items-center bg-transparent">
        <button
          className={`h-[4.5vw] w-[4vw]`}
          onClick={activeIndexDoc === 7 ? () => handleClickDoc(0) : () => handleClickDoc(7)}
        >
          <img
            src={activeIndexDoc == 7 ? arrow1 : arrow}
            alt=""
            className="m-auto h-[2.5vw] w-[2.5vw]"
          ></img>
        </button>
      </section>
      <div className={`hidden transition-all ${checkActiveDoc(7, '!block')}`}>
        <Documentations />
      </div>
    </div>
  );
};
