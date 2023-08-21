import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import {
  CompilerProps,
  DiagramEditor,
  Documentations,
  FlasherProps,
  PlatformSelectModal,
  SaveModalData,
  SaveRemindModal,
  MessageModal,
  MessageModalData,
  Sidebar,
  SidebarCallbacks,
  Tabs,
  TabDataAdd,
} from './components';
import { ReactComponent as EditorIcon } from '@renderer/assets/icons/editor.svg';
import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow.svg';
import { isLeft, unwrapEither } from './types/Either';
import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from './lib/data/PlatformLoader';
import { preloadPicto } from './lib/drawable/Picto';
import { Compiler } from './components/Modules/Compiler';
import { CompilerResult } from './types/CompilerTypes';
import { Flasher } from './components/Modules/Flasher';
import { Device } from './types/FlasherTypes';
import { Component as ComponentData } from './types/diagram';
import useEditorManager from './components/utils/useEditorManager';
import {
  ComponentSelectData,
  ComponentSelectModal,
  emptyCompData,
} from './components/ComponentSelectModal';
import { hideLoadingOverlay } from './components/utils/OverlayControl';
import {
  ComponentEditData,
  ComponentEditModal,
  emptyCompEditData,
} from './components/ComponentEditModal';

/**
 * React-компонент приложения
 */
export const App: React.FC = () => {
  // TODO: а если у нас будет несколько редакторов?
  const [currentDevice, setCurrentDevice] = useState<string | undefined>(undefined);
  const [flasherConnectionStatus, setFlasherConnectionStatus] = useState<string>('Не подключен.');
  const [flasherDevices, setFlasherDevices] = useState<Map<string, Device>>(new Map());
  const [flasherLog, setFlasherLog] = useState<string | undefined>(undefined);

  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState<string>('Не подключен.');
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [importData, setImportData] = useState<string | undefined>(undefined);

  const lapki = useEditorManager();
  const editor = lapki.editor;
  const manager = lapki.managerRef.current;
  const editorData = lapki.editorData;
  const [isDocOpen, setIsDocOpen] = useState(false);

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const openPlatformModal = () => setIsPlatformModalOpen(true);
  const closePlatformModal = () => setIsPlatformModalOpen(false);

  const [compAddModalData, setCompAddModalData] = useState<ComponentSelectData>(emptyCompData);
  const [isCompAddModalOpen, setIsCompAddModalOpen] = useState(false);
  const openCompAddModal = () => setIsCompAddModalOpen(true);
  const closeCompAddModal = () => setIsCompAddModalOpen(false);

  const [compEditModalData, setCompEditModalData] = useState<ComponentEditData>(emptyCompEditData);
  const [isCompEditModalOpen, setIsCompEditModalOpen] = useState(false);
  const openCompEditModal = () => setIsCompEditModalOpen(true);
  const closeCompEditModal = () => setIsCompEditModalOpen(false);

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
    if (editorData.content && editorData.modified) {
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
    if (editorData.content && editorData.modified) {
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
    await manager?.saveIntoFolder(compilerData!.source!);
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

  const handleLocalFlasher = async () => {
    console.log('local');
    await manager?.startLocalModule('lapki-flasher');
    //Стандартный порт
    manager?.changeFlasherHost('localhost', 8080);
  };

  const handleRemoteFlasher = () => {
    console.log('remote');
    // await manager?.stopLocalModule('lapki-flasher');
    manager?.changeFlasherHost('localhost', 8089);
  };

  const [tabData, setTabData] = useState<TabDataAdd | null>(null);
  const onCodeSnippet = (type: string, name: string, code: string) => {
    setTabData({ type, name, code });
  };

  const handleAddStdoutTab = () => {
    console.log(compilerData!.stdout);
    onCodeSnippet('Компилятор', 'stdout', compilerData!.stdout ?? '');
  };

  const handleAddStderrTab = () => {
    onCodeSnippet('Компилятор', 'stderr', compilerData!.stderr ?? '');
  };

  const handleImport = async (platform: string) => {
    await manager?.import(platform, setOpenData);
  };

  useEffect(() => {
    if (importData && openData) {
      manager?.parseImportData(importData, openData!);
      setImportData(undefined);
    }
  }, [importData]);

  const flasherProps: FlasherProps = {
    devices: flasherDevices,
    currentDevice: currentDevice,
    connectionStatus: flasherConnectionStatus,
    flasherLog: flasherLog,
    compilerData: compilerData,
    setCurrentDevice: setCurrentDevice,
    handleGetList: handleGetList,
    handleFlash: handleFlashBinary,
    handleLocalFlasher: handleLocalFlasher,
    handleRemoteFlasher: handleRemoteFlasher,
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

  const onRequestAddComponent = () => {
    const machine = editor!.container.machine;
    const vacantComponents = machine.getVacantComponents();
    const existingComponents = new Set<string>();
    for (const name of machine.components.keys()) {
      existingComponents.add(name);
    }
    setCompAddModalData({ vacantComponents, existingComponents });
    openCompAddModal();
  };

  const handleAddComponent = (idx: string, name?: string) => {
    const realName = name ?? idx;
    editor!.container.machine.addNewComponent(realName, idx);
    // console.log(['handleAddComponent', idx, name]);
  };

  const onRequestEditComponent = (idx: string) => {
    const machine = editor!.container.machine;
    const component = machine.components.get(idx);
    if (typeof component === 'undefined') return;
    const data = component.data;
    const proto = machine.platform.data.components[data.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', idx, data.type);
      return;
    }

    const existingComponents = new Set<string>();
    for (const name of machine.components.keys()) {
      if (name == idx) continue;
      existingComponents.add(name);
    }

    console.log(['component-edit', idx, data, proto]);
    setCompEditModalData({ idx, data, proto, existingComponents });
    openCompEditModal();
  };

  const handleEditComponent = (idx: string, data: ComponentData) => {
    console.log(['component-edit', idx, data]);
  };

  const handleDeleteComponent = (idx: string) => {
    console.log(['component-delete', idx]);
  };

  const sidebarCallbacks: SidebarCallbacks = {
    onRequestNewFile: handleNewFile,
    onRequestOpenFile: handleOpenFile,
    onRequestSaveFile: handleSaveFile,
    onRequestSaveAsFile: handleSaveAsFile,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestImport: handleImport,
  };
  useEffect(() => {
    Compiler.bindReact(setCompilerData, setCompilerStatus, setImportData);
    Compiler.connect(`${Compiler.base_address}main`);
    preloadPlatforms(() => {
      preparePreloadImages();
      preloadPicto(() => void {});
      console.log('plaforms loaded!');
      hideLoadingOverlay();
      const errs = getPlatformsErrors();
      if (Object.keys(errs).length > 0) {
        openPlatformError(errs);
      }
    });
  }, []);

  const tabsItems = [
    {
      svgIcon: <EditorIcon />,
      //tab: editorData.shownName ? 'SM: ' + editorData.shownName : 'SM: unnamed',
      cantClose: true,
      content: (
        <DiagramEditor
          manager={manager!}
          editor={editor}
          setEditor={lapki.setEditor}
          onCodeSnippet={onCodeSnippet}
        />
      ),
    },
  ];

  useEffect(() => {
    Flasher.bindReact(setFlasherDevices, setFlasherConnectionStatus, setFlasherLog);
    const reader = new FileReader();
    Flasher.initReader(reader);
    Flasher.connect(Flasher.base_address);
  }, []);

  return (
    <div className="h-screen select-none">
      <div className="flex h-full w-full flex-row overflow-hidden">
        <Sidebar
          editorRef={lapki}
          flasherProps={flasherProps}
          compilerProps={compilerProps}
          callbacks={sidebarCallbacks}
        />

        <div className="flex w-full min-w-0">
          <div
            className={twMerge(
              'max-w-[calc(100%-2rem)] flex-1',
              isDocOpen && 'max-w-[calc(100%-27rem)]'
            )}
          >
            {editorData.content ? (
              <Tabs tabsItems={tabsItems} tabData={tabData} setTabData={setTabData} />
            ) : (
              <p className="pt-24 text-center font-Fira text-base">
                Откройте файл или перенесите его сюда...
              </p>
            )}
          </div>

          <div className={twMerge('m-auto flex h-[calc(100vh-2rem)] bg-white')}>
            <button className="relative w-8" onClick={() => setIsDocOpen((p) => !p)}>
              <Arrow transform={isDocOpen ? 'rotate(0)' : 'rotate(180)'} />
            </button>

            <div className={twMerge('w-[400px] transition-all', !isDocOpen && 'hidden')}>
              <Documentations baseUrl={'https://lapki-doc.polyus-nt.ru/'} />
            </div>
          </div>
        </div>
      </div>

      <SaveRemindModal isOpen={isSaveModalOpen} isData={saveModalData} onClose={closeSaveModal} />
      <MessageModal isOpen={isMsgModalOpen} isData={msgModalData} onClose={closeMsgModal} />
      <PlatformSelectModal
        isOpen={isPlatformModalOpen}
        onCreate={performNewFile}
        onClose={closePlatformModal}
      />
      <ComponentSelectModal
        isOpen={isCompAddModalOpen}
        data={compAddModalData}
        onClose={closeCompAddModal}
        onSubmit={handleAddComponent}
      />
      <ComponentEditModal
        isOpen={isCompEditModalOpen}
        data={compEditModalData}
        onClose={closeCompEditModal}
        onComponentEdit={handleEditComponent}
        onComponentDelete={handleDeleteComponent}
      />
    </div>
  );
};
