import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Panel, PanelGroup } from 'react-resizable-panels';

import { CodeEditor, DiagramEditor, Documentations, Tabs } from './components';
import { Sidebar } from './components/Sidebar';
import { Elements } from './types/diagram';
/*Первые иконки*/
import arrow from './assets/img/arrow.png';
// import forward from './assets/img/forward.png';
/*Вторичные иконки*/
import arrow1 from './assets/img/arrow1.png';
import { CanvasEditor } from './lib/CanvasEditor';
import { preloadPicto } from './lib/drawable/Picto';
/**
 * React-компонент приложения
 */
export const App: React.FC = () => {
  preloadPicto(()=> void {});

  // TODO: а если у нас будет несколько редакторов?

  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
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

  //Создание нового файла
  const handleNewFile = async () => {
    const FileNew = '{"states": {},"initialState": {},"transitions": []}';
    setFileName('Новый файл.json');
    setFileContent(FileNew);
    console.log(FileNew);
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
    <DiagramEditor elements={elements!} editor={editor} setEditor={setEditor}/>,
    <CodeEditor value={localStorage.getItem('Data') ?? ''} />,
  ];

  return (
    <div className="h-screen select-none">
      <PanelGroup direction="horizontal">
        <Sidebar stateMachine={editor?.container.machine} onRequestOpenFile={handleOpenFile} onRequestNewFile={handleNewFile} />

        <Panel>
          <div className="flex">
            <div className="flex-1">
              {elements ? (
                <>
                  <div className="flex h-[2rem] items-center justify-between border-b border-[#4391BF]">
                    <Tabs fileName={fileName} functionTabs={handleClick} isActive={isActive} />
                    <p></p>
                    {/*<button className="w-[4vw]">
                      <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
                    </button>*/}
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
              <button className="relative h-auto w-8" onClick={() => setIsDocOpen((p) => !p)}>
                <img src={isDocOpen ? arrow1 : arrow} alt="" className="pointer-events-none" />
              </button>

              <div className={twMerge('w-96 transition-all', !isDocOpen && 'hidden')}>
                <Documentations />
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};
