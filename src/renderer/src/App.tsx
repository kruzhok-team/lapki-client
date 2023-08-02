import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Panel, PanelGroup } from 'react-resizable-panels';

import { CodeEditor, DiagramEditor, Documentations, MenuProps } from './components';
import { Sidebar } from './components/Sidebar';
import { Elements, emptyElements } from './types/diagram';
/*Первые иконки*/
import arrow from './assets/img/arrow.png';
// import forward from './assets/img/forward.png';
/*Вторичные иконки*/
import arrow1 from './assets/img/arrow1.png';
import { ReactComponent as Cross } from '@renderer/assets/icons/cross.svg';
import { CanvasEditor } from './lib/CanvasEditor';
import { preloadPicto } from './lib/drawable/Picto';
import { EditorManager, EditorData, emptyEditorData } from './lib/data/EditorManager';
import { isLeft, unwrapEither } from './types/Either';

/**
 * React-компонент приложения
 */
export const App: React.FC = () => {
  preloadPicto(() => void {});

  // TODO: а если у нас будет несколько редакторов?

  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  let [editorData, setEditorData] = useState<EditorData>(emptyEditorData);
  const elements = editorData.content ? (JSON.parse(editorData.content) as Elements) : null;
  const [isDocOpen, setIsDocOpen] = useState(false);
  const manager = new EditorManager(editor, editorData, setEditorData);

  /*Открытие файла*/
  const handleOpenFile = async () => {
    // TODO: переспрашивать, если файл изменён
    const result = await manager.open();
    if (isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        // TODO: вывод ошибки чтения
        console.log(cause);
      }
    }
  };

  //Создание нового файла
  const handleNewFile = async () => {
    // TODO: переспрашивать, если файл изменён
    manager.newFile();
  };

  const handleSaveAsFile = async () => {
    const result = await manager.saveAs();
    if (isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        // TODO: вывод ошибки сохранения
        console.log(cause);
      }
    }
  };

  const handleSaveFile = async () => {
    const result = await manager.save();
    if (isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        // TODO: вывод ошибки сохранения
        console.log(cause);
      }
    } else {
      // TODO: информировать об успешном сохранении
    }
  };
  const menuProps: MenuProps = {
    onRequestNewFile: handleNewFile,
    onRequestOpenFile: handleOpenFile,
    onRequestSaveFile: handleSaveFile,
    onRequestSaveAsFile: handleSaveAsFile,
  };

  //Callback данные для получения ответа от контекстного меню
  const [idTextCode, setIdTextCode] = useState<string | null>(null);
  const [elementCode, setElementCode] = useState<string | null>(null);

  var tabsItems = [
    {
      tab: editorData.shownName ? 'SM: ' + editorData.shownName : 'SM: unnamed',
      content: (
        <DiagramEditor
          elements={elements!}
          editor={editor}
          setEditor={setEditor}
          setIdTextCode={setIdTextCode}
          setElementCode={setElementCode}
        />
      ),
    },
    {
      tab: editorData.shownName ? 'CODE: ' + editorData.shownName : 'CODE: unnamed',
      content: <CodeEditor value={localStorage.getItem('Data') ?? ''} />,
    },
  ];

  /** Функция выбора вкладки (машина состояний, код) */
  var [activeTab, setActiveTab] = useState<number | 0>(0);
  var isActive = (index: number) => activeTab === index;

  if (idTextCode !== null && idTextCode !== 'FullCode') {
    tabsItems.indexOf({ tab: idTextCode, content: <CodeEditor value={elementCode ?? ''} /> }) === -1
      ? tabsItems.push({ tab: idTextCode, content: <CodeEditor value={elementCode ?? ''} /> })
      : console.log('This item already exists');
  } else {
    isActive(1);
  }
  const handleShowTabs = async (index: number) => {
    if (activeTab === index) {
      setActiveTab(activeTab);
    }
    setActiveTab(index);
  };
  //Функция закрытия вкладки (РАБОЧАЯ)
  const onClose = (id: number) => {
    //Удаляем необходимую вкладку
    tabsItems.splice(id, 1);
    //Активируем самую первую вкладку
    isActive(0);
  };

  return (
    <div className="h-screen select-none">
      <PanelGroup direction="horizontal">
        <Sidebar stateMachine={editor?.container.machine} menuProps={menuProps} />

        <Panel>
          <div className="flex">
            <div className="flex-1">
              {elements ? (
                <>
                  <div className="flex h-[2rem] items-center border-b border-[#4391BF]">
                    <div className="flex font-Fira ">
                      {tabsItems.map((name, id) => (
                        <div
                          key={'tab' + id}
                          className={twMerge(
                            'flex items-center p-1 hover:bg-[#4391BF] hover:bg-opacity-50',
                            isActive(id) && 'bg-[#4391BF] bg-opacity-50'
                          )}
                        >
                          <div
                            role="button"
                            onClick={() => handleShowTabs(id)}
                            className="line-clamp-1 p-1 "
                          >
                            {name.tab}
                          </div>
                          <button onClick={() => onClose(id)} className="p-1 hover:bg-[#FFFFFF]">
                            <Cross width="1rem" height="1rem" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/*<button className="w-[4vw]">
                      <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
                    </button>*/}
                  </div>
                  {tabsItems.map((name, id) => (
                    <div
                      key={id + 'ActiveBlock'}
                      className={twMerge('hidden h-[calc(100vh-2rem)]', isActive(id) && 'block')}
                    >
                      {name.content}
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
