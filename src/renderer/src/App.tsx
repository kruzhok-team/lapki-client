import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import {
  CompilerProps,
  DiagramEditor,
  FlasherProps,
  PlatformSelectModal,
  FlasherSelectModal,
  FlasherRemoteHostModal,
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

import { isLeft, unwrapEither } from './types/Either';
import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from './lib/data/PlatformLoader';
import { preloadPicto } from './lib/drawable/Picto';
import { Compiler } from './components/Modules/Compiler';
import { CompilerResult } from './types/CompilerTypes';
import { FLASHER_LOCAL_HOST, FLASHER_LOCAL_PORT, Flasher } from './components/Modules/Flasher';
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

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const openPlatformModal = () => setIsPlatformModalOpen(true);
  const closePlatformModal = () => setIsPlatformModalOpen(false);

  const [isFlasherModalOpen, setIsFlasherModalOpen] = useState(false);
  const openFlasherModal = () => setIsFlasherModalOpen(true);
  const closeFlasherModal = () => setIsFlasherModalOpen(false);

  const [isFlasherRemoteHostModalOpen, setIsFlasherRemoteHostModalOpen] = useState(false);
  const openFlasherRemoteHostModal = () => setIsFlasherRemoteHostModalOpen(true);
  const closeFlasherRemoteHostModal = () => setIsFlasherRemoteHostModalOpen(false);

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

  const handleHostChange = async () => {
    if (Flasher.connecting) {
      // вывести сообщение: Нельзя сменить хост во время подключения
    } else {
      openFlasherModal();
    }
  };

  const handleLocalFlasher = async () => {
    console.log('local');
    await manager?.startLocalModule('lapki-flasher');
    //Стандартный порт
    manager?.changeFlasherHost(FLASHER_LOCAL_HOST, FLASHER_LOCAL_PORT);
  };

  const handleRemoteFlasher = (host: string, port: number) => {
    //openFlasherRemoteHostModal();
    console.log('remote');
    // await manager?.stopLocalModule('lapki-flasher');
    manager?.changeFlasherHost(host, port);
  };

  const handleRemoteHostFlasherSubmit = (host: string, port: number) => {
    console.log('remote');
    // await manager?.stopLocalModule('lapki-flasher');
    manager?.changeFlasherHost(host, port);
  };

  const [tabData, setTabData] = useState<TabDataAdd | null>(null);
  const onCodeSnippet = (type: string, name: string, code: string, language: string) => {
    setTabData({ type, name, code, language });
  };

  const handleAddStdoutTab = () => {
    console.log(compilerData!.stdout);
    onCodeSnippet('Компилятор', 'stdout', compilerData!.stdout ?? '', 'txt');
  };

  const handleAddStderrTab = () => {
    onCodeSnippet('Компилятор', 'stderr', compilerData!.stderr ?? '', 'txt');
  };

  const handleShowSource = () => {
    compilerData!.source!.map((element) => {
      console.log('here!');
      onCodeSnippet(
        'Компилятор',
        `${element.filename}.${element.extension}`,
        element.fileContent,
        'cpp'
      );
    });
    // const source = compilerData!.source!;
    // onCodeSnippet(
    //   'Компилятор',
    //   `${source[0].filename}.${source[0].extension}`,
    //   source[0].fileContent ?? '',
    //   'cpp'
    // );
    // onCodeSnippet(
    //   'Компилятор',
    //   `${source[1].filename}.${source[1].extension}`,
    //   source[1].fileContent ?? '',
    //   'cpp'
    // );
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
    handleHostChange: handleHostChange,
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
    handleShowSource: handleShowSource,
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
    console.log('CONNECTING TO COMPILER');
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
      canClose: false,
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
    console.log('CONNECTING TO FLASHER');
    Flasher.connect(Flasher.base_address);
    // если не указывать второй аргумент '[]', то эта функция будет постоянно вызываться.
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

        <div className="w-full min-w-0 bg-bg-primary">
          {editorData.content ? (
            <Tabs tabsItems={tabsItems} tabData={tabData} setTabData={setTabData} />
          ) : (
            <p className="pt-24 text-center text-base">Откройте файл или перенесите его сюда...</p>
          )}
        </div>
      </div>

      <SaveRemindModal isOpen={isSaveModalOpen} isData={saveModalData} onClose={closeSaveModal} />
      <MessageModal isOpen={isMsgModalOpen} isData={msgModalData} onClose={closeMsgModal} />
      <PlatformSelectModal
        isOpen={isPlatformModalOpen}
        onCreate={performNewFile}
        onClose={closePlatformModal}
      />
      <FlasherSelectModal
        isOpen={isFlasherModalOpen}
        handleLocal={handleLocalFlasher}
        handleRemote={handleRemoteFlasher}
        onClose={closeFlasherModal}
      />
      <FlasherRemoteHostModal
        isOpen={isFlasherRemoteHostModalOpen}
        onSubmit={handleRemoteHostFlasherSubmit}
        onClose={closeFlasherRemoteHostModal}
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
