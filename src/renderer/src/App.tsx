import React, { useState } from 'react';

import { CodeEditor, DiagramEditor, Documentations, Tabs } from './components';
import { Elements } from './types/diagram';
import { Sidebar } from './components/Sidebar';

/*Первые иконки*/
import arrow from './assets/img/arrow.png';
import forward from './assets/img/forward.png';
/*Вторичные иконки*/
import arrow1 from './assets/img/arrow1.png';
import { twMerge } from 'tailwind-merge';

export const App: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  /*const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);*/
  const elements = fileContent ? (JSON.parse(fileContent) as Elements) : null;
  const [isDocOpen, setIsDocOpen] = useState(false);
  /*Открытие файла*/
  const handleOpenFile = async () => {
    const FileDate = await window.electron.ipcRenderer.invoke('dialog:openFile');
    /*Выгружаю имя файла*/
    setFileName(FileDate[0]);
    /*Выгружаю содержимое файла*/
    setFileContent(FileDate[1]);
  };

  const handleNewFile = async () => {
    const FileNew = '{"states": {},"initialState": {},"transitions": []}';
    setFileName('Новый файл.json');
    setFileContent(FileNew);
  };

  /** Callback функция выбора вкладки (машина состояний, код) */
  const [activeTab, setActiveTab] = useState<number | 0>(0);
  const isActive = (index: number) => activeTab === index;
  const handleClick = (index: number) => {
    if (activeTab === index) {
      return setActiveTab(activeTab);
    }
    setActiveTab(index);
  };

  const ActiveEditor = [
    <DiagramEditor elements={elements} />,
    <CodeEditor value={localStorage.getItem('Data') ?? ''} />,
  ];
  return (
    <div className="flex h-full select-none">
      <Sidebar onRequestOpenFile={handleOpenFile} onRequestNewFile={handleNewFile} />

      <div className="flex-1">
        {elements ? (
          <>
            <div className="flex h-[2rem] items-center justify-between border-b border-[#4391BF]">
              <Tabs fileName={fileName} functionTabs={handleClick} isActive={isActive} />
              <p></p>
              <button className="w-[4vw]">
                <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
              </button>
            </div>
            {ActiveEditor.map((Element, i) => (
              <div
                key={i + 'ActiveBlock'}
                className={twMerge('hidden h-[calc(100vh-2rem)]', isActive(i) && 'block')}
              >
                {Element}
              </div>
            ))}
          </>
        ) : (
          <p className="pt-24 text-center font-Fira text-base">
            Откройте файл или перенесите его сюда...
          </p>
        )}
      </div>
      <div className="bottom-0 right-0 m-auto flex h-[calc(100vh-2rem)]">
        <button
          className="absolute ml-[-32px] h-auto w-8 bg-transparent"
          onClick={() => setIsDocOpen((p) => !p)}
        >
          <img src={isDocOpen ? arrow1 : arrow} alt="" />
        </button>

        <div className={twMerge('w-96 transition-all', !isDocOpen && 'hidden')}>
          <Documentations />
        </div>
      </div>
    </div>
  );
};
