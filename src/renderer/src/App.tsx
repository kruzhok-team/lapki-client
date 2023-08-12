import { FC, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Panel, PanelGroup } from 'react-resizable-panels';

import {
  CodeEditor,
  CompilerProps,
  DiagramEditor,
  Documentations,
  FlasherProps,
  MenuProps,
} from './components';
import { Sidebar } from './components/Sidebar';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow.svg';
import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';
import { isLeft, unwrapEither } from './types/Either';
import { SaveModalData, SaveRemindModal } from './components/SaveRemindModal';
import { MessageModal, MessageModalData } from './components/MessageModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from './lib/data/PlatformLoader';
import { preloadPicto } from './lib/drawable/Picto';
import { PlatformSelectModal } from './components/PlatformSelectModal';
import { Compiler } from './components/Modules/Compiler';
import { CompilerResult } from './types/CompilerTypes';
import { Flasher } from './components/Modules/Flasher';
import { Device } from './types/FlasherTypes';
import useEditorManager from './components/utils/useEditorManager';

/**
 * React-компонент приложения
 */
export const App: FC = () => {
  // TODO: а если у нас будет несколько редакторов?
  const [currentDevice, setCurrentDevice] = useState<string | undefined>(undefined);
  const [flasherConnectionStatus, setFlasherConnectionStatus] = useState<string>('Не подключен.');
  const [flasherDevices, setFlasherDevices] = useState<Map<string, Device>>(new Map());
  const [flasherLog, setFlasherLog] = useState<string | undefined>(undefined);

  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState<string>('Не подключен.');

  const lapki = useEditorManager();
  const editor = lapki.editor;
  const manager = lapki.managerRef.current;
  const editorData = lapki.editorData;
  const [isDocOpen, setIsDocOpen] = useState(false);

  const [isLoadingOverlay, setLoadingOverlay] = useState<boolean>(true);

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const openPlatformModal = () => setIsPlatformModalOpen(true);
  const closePlatformModal = () => setIsPlatformModalOpen(false);

  const [saveModalData, setSaveModalData] = useState<SaveModalData>();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const openSaveModal = () => setIsSaveModalOpen(true);
  const closeSaveModal = () => setIsSaveModalOpen(false);

  const [msgModalData, setMsgModalData] = useState<MessageModalData>();
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const openMsgModal = (data: MessageModalData) => {
    setMsgModalData(data);
    setIsMsgModalOpen(true);
  };
  const closeMsgModal = () => setIsMsgModalOpen(false);
  const openSaveError = (cause) => {
    openMsgModal({
      caption: 'Ошибка',
      text: (
        <div>
          <p> Не удалось записать схему в </p>
          <code>{cause.name}</code>
          <br /> <br />
          <p> {cause.content} </p>
        </div>
      ),
    });
  };
  const openLoadError = (cause) => {
    openMsgModal({
      caption: 'Ошибка',
      text: (
        <div>
          <p> Не удалось прочесть схему из </p>
          <code>{cause.name}</code>
          <br /> <br />
          <p> {cause.content} </p>
        </div>
      ),
    });
  };
  const openPlatformError = (errs: { [k: string]: string }) => {
    openMsgModal({
      caption: 'Внимание',
      text: (
        <div>
          <p> Есть проблемы с загруженными платформами. </p>
          <br />
          <ul>
            {Object.entries(errs).map(([platform, err]) => {
              return (
                <li key={platform}>
                  <b>{platform}</b>: {err}
                </li>
              );
            })}
          </ul>
        </div>
      ),
    });
  };

  const handleGetList = async () => {
    manager?.getList();
  };

  const handleFlashBinary = async () => {
    //Рассчет на то, что пользователь не сможет нажать кнопку загрузки,
    //если нет данных от компилятора
    manager?.flash(compilerData!.binary!, currentDevice!);
  };

  const handleSaveBinaryIntoFolder = async () => {
    const preparedData = await Compiler.prepareToSave(compilerData!.binary!);
    manager?.saveIntoFolder(preparedData);
  };

  /*Открытие файла*/
  const handleOpenFile = async () => {
    // TODO: if (editorData.modified)
    if (editorData.content) {
      setSaveModalData({
        shownName: editorData.shownName,
        question: 'Хотите сохранить файл перед тем, как открыть другой?',
        onConfirm: performOpenFile,
        onSave: handleSaveFile,
      });
      openSaveModal();
    } else {
      await performOpenFile();
    }
  };

  const performOpenFile = async () => {
    const result = await manager?.open();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openLoadError(cause);
      }
    }
  };
  //Создание нового файла
  const handleNewFile = async () => {
    // TODO: if (editorData.modified)
    if (editorData.content) {
      setSaveModalData({
        shownName: editorData.shownName,
        question: 'Хотите сохранить файл перед тем, как создать новый?',
        onConfirm: openPlatformModal,
        onSave: handleSaveFile,
      });
      openSaveModal();
    } else {
      openPlatformModal();
    }
  };

  const performNewFile = (idx: string) => {
    manager?.newFile(idx);
  };

  const handleCompile = async () => {
    manager?.compile(editor!.container.machine.platformIdx);
  };

  const handleSaveSourceIntoFolder = async () => {
    await manager?.saveIntoFolder(compilerData!.source);
  };

  const handleSaveAsFile = async () => {
    const result = await manager?.saveAs();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openSaveError(cause);
      }
    }
  };

  const handleSaveFile = async () => {
    const result = await manager?.save();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openSaveError(cause);
      }
    } else {
      // TODO: информировать об успешном сохранении
    }
  };

  const addTab = (name: string, content: string) => {
    tabsItems.push({
      tab: name,
      content: <CodeEditor value={content} />,
    });
  };

  const handleAddStdoutTab = () => {
    console.log(compilerData!.stdout);
    addTab('stdout', compilerData!.stdout);
  };

  const handleAddStderrTab = () => {
    addTab('stderr', compilerData!.stderr);
  };

  const flasherProps: FlasherProps = {
    devices: flasherDevices,
    currentDevice: currentDevice,
    connectionStatus: flasherConnectionStatus,
    flasherLog: flasherLog,
    compilerData: compilerData,
    setCurrentDevice: setCurrentDevice,
    handleGetList: handleGetList,
    handleFlash: handleFlashBinary,
  };

  const compilerProps: CompilerProps = {
    compilerData: compilerData,
    compilerStatus: compilerStatus,
    fileReady: editor !== null,
    handleAddStdoutTab: handleAddStdoutTab,
    handleAddStderrTab: handleAddStderrTab,
    handleCompile: handleCompile,
    handleSaveSourceIntoFolder: handleSaveSourceIntoFolder,
    handleSaveBinaryIntoFolder: handleSaveBinaryIntoFolder,
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
  const countRef = useRef<{ tab: string; content: JSX.Element }[]>([]);
  const onCodeSnippet = (id: string, code?: string) => {
    setIdTextCode(id);
    setElementCode(code ?? null);
  };

  const tabsItems = [
    {
      tab: editorData.shownName ? 'SM: ' + editorData.shownName : 'SM: unnamed',
      content: (
        <DiagramEditor
          manager={manager!}
          editor={editor}
          setEditor={lapki.setEditor}
          onCodeSnippet={onCodeSnippet}
        />
      ),
    },
    {
      tab: editorData.shownName ? 'CODE: ' + editorData.shownName : 'CODE: unnamed',
      content: <CodeEditor value={editorData.content ?? ''} />,
    },
  ];

  /** Функция выбора вкладки (машина состояний, код) */
  var [activeTab, setActiveTab] = useState<number | 0>(0);
  var isActive = (index: number) => activeTab === index;
  const handleShowTabs = (id: number) => {
    if (activeTab === id) {
      setActiveTab(activeTab);
    }
    setActiveTab(id);
  };

  //Проверяем сколько элементов в массиве, если меньше 2, то записываем в useRef
  if (countRef.current.length <= 2) {
    countRef.current = [];
    countRef.current = tabsItems;
  }

  if (idTextCode !== null) {
    const trueTab = countRef.current.find((item) => item.tab === idTextCode);
    if (trueTab === undefined) {
      countRef.current.push({
        tab: idTextCode,
        content: <CodeEditor value={elementCode ?? ''} />,
      });
      handleShowTabs(countRef.current.length - 1);
    }
  }
  //Функция закрытия вкладки (РАБОЧАЯ)
  const onClose = (id: number) => {
    console.log(id);
    console.log(countRef.current);
    //Удаляем необходимую вкладку
    countRef.current.splice(id, 1);
    countRef.current = tabsItems;
    handleShowTabs(0);
  };

  useEffect(() => {
    Flasher.bindReact(setFlasherDevices, setFlasherConnectionStatus, setFlasherLog);
    Flasher.initReader();
    Flasher.connect(Flasher.base_address);

    Compiler.bindReact(setCompilerData, setCompilerStatus);
    Compiler.connect(`${Compiler.base_address}main`);
    preloadPlatforms(() => {
      preparePreloadImages();
      preloadPicto(() => void {});
      console.log('plaforms loaded!');
      setLoadingOverlay(false);
      const errs = getPlatformsErrors();
      if (Object.keys(errs).length > 0) {
        openPlatformError(errs);
      }
    });
  }, []);

  return (
    <div className="h-screen select-none">
      <PanelGroup direction="horizontal">
        <Sidebar
          editorRef={lapki}
          flasherProps={flasherProps}
          compilerProps={compilerProps}
          menuProps={menuProps}
        />

        <Panel>
          <div className="flex">
            <div className="flex-1">
              {editorData.content /* && countRef.current */ ? (
                <>
                  <div className="flex h-[2rem] items-center border-b border-[#4391BF]">
                    <div className="flex font-Fira">
                      {countRef.current.map((name, id) => (
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
                            <Close width="1rem" height="1rem" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/*<button className="w-[4vw]">
                      <img src={forward} alt="" className="m-auto h-[2.5vw] w-[2.5vw]"></img>
                    </button>*/}
                  </div>
                  {countRef.current.map((name, id) => (
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

            <div className={twMerge('bottom-0 right-0 m-auto flex h-[calc(100vh-2rem)] bg-white')}>
              <button className="relative w-8" onClick={() => setIsDocOpen((p) => !p)}>
                <Arrow transform={isDocOpen ? 'rotate(0)' : 'rotate(180)'} />
              </button>

              <div className={twMerge('w-96 transition-all', !isDocOpen && 'hidden')}>
                <Documentations />
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>

      <SaveRemindModal isOpen={isSaveModalOpen} isData={saveModalData} onClose={closeSaveModal} />
      <MessageModal isOpen={isMsgModalOpen} isData={msgModalData} onClose={closeMsgModal} />
      <PlatformSelectModal
        isOpen={isPlatformModalOpen}
        onCreate={performNewFile}
        onClose={closePlatformModal}
      />

      <LoadingOverlay isOpen={isLoadingOverlay}></LoadingOverlay>
    </div>
  );
};
