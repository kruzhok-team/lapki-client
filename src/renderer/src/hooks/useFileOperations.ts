import { useState, useEffect, useCallback, Dispatch } from 'react';

import { toast } from 'sonner';

import { SaveModalData } from '@renderer/components';
import { StateMachinesStackItem } from '@renderer/components/CreateSchemeModal/StateMachinesStack';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { importGraphml } from '@renderer/lib/data/GraphmlParser';
import { useModelContext } from '@renderer/store/ModelContext';
import { SidebarIndex, useSidebar } from '@renderer/store/useSidebar';
import { useTabs } from '@renderer/store/useTabs';
import { Elements } from '@renderer/types/diagram';
import { isLeft, isRight, unwrapEither } from '@renderer/types/Either';

const tempSaveKey = 'tempSave';

interface useFileOperationsArgs {
  openLoadError: (cause: any) => void;
  openSaveError: (cause: any) => void;
  openCreateSchemeModal: () => void;
  openImportError: (error: string) => void;
}

export const useFileOperations = (args: useFileOperationsArgs) => {
  const { openLoadError, openSaveError, openCreateSchemeModal, openImportError } = args;
  const { changeTab } = useSidebar();
  const modelController = useModelContext();
  const model = modelController.model;
  const name = modelController.model.useData('', 'name') as string | null;
  const isStale = modelController.model.useData('', 'isStale');
  const [clearTabs, openTab] = useTabs((state) => [state.clearTabs, state.openTab]);

  const [data, setData] = useState<SaveModalData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const openSaveModal = () => setIsOpen(true);
  const onClose = () => {
    window.electron.ipcRenderer.send('reset-close');
    setIsOpen(false);
  };

  // Открыть вкладки на каждый контроллер
  const openTabs = (openAll?: boolean) => {
    changeTab(SidebarIndex.Explorer);
    for (const controllerId in modelController.controllers) {
      if (controllerId === '') continue;
      const controller = modelController.controllers[controllerId];
      if (controller.type === 'scheme') continue; // Схемотехнический экран открываем только по кнопке в меню
      const stateMachines = Object.keys(controller.stateMachinesSub);
      const smId = stateMachines[0] ?? controllerId;
      // ID контроллера равен ID канваса.
      openTab(modelController, {
        type: 'editor',
        name: modelController.model.data.elements.stateMachines[smId].name ?? smId,
        canvasId: controllerId,
      });
      // (chekoopa) ОБСУДИТЬ! Кажется, разумнее сейчас оставить открытие только первой машины состояний.
      // И в будущем сделать открытие всех машин опцией. Но это в будущем.
      // (Roundabout1) Сейчас все вкладки открываются только при создании документа
      if (!openAll) break;
    }
  };

  /*Открытие файла*/
  const handleOpenFile = async (path?: string) => {
    if (isStale) {
      setData({
        shownName: name,
        question: 'Хотите сохранить файл перед тем, как открыть другой?',
        onConfirm: async () => await performOpenFile(path),
        onSave: handleSaveFile,
        onOpen: async () => await performOpenFile(path),
      });
      openSaveModal();
    } else {
      await performOpenFile(path);
    }
  };

  const performOpenFile = async (path?: string) => {
    const result = await modelController.files.open(openImportError, path);
    Compiler.setCompilerData(undefined);

    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openLoadError(cause);
      }
    }

    if (result && isRight(result)) {
      clearTabs();
      openTabs();
    }
  };

  const handleOpenFromTemplate = async (type: string, name: string) => {
    await modelController.files.createFromTemplate(type, name, openImportError);
    Compiler.setCompilerData(undefined);
    clearTabs();
    openTabs();
  };

  //Создание нового файла
  const handleNewFile = async () => {
    if (isStale) {
      setData({
        shownName: name,
        question: 'Хотите сохранить файл перед тем, как создать новый?',
        onConfirm: openCreateSchemeModal,
        onSave: handleSaveFile,
        onOpen: () => openCreateSchemeModal(),
      });
      openSaveModal();
    } else {
      openCreateSchemeModal();
    }
  };

  const performNewFile = (stateMachines: StateMachinesStackItem[]) => {
    Compiler.setCompilerData(undefined);
    modelController.files.newFile(stateMachines);
    clearTabs();
    openTabs(true);
  };

  const handleSaveAsFile = async () => {
    const result = await modelController.files.saveAs();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openSaveError(cause);
      }
    } else {
      toast.success('Схема сохранена!');
    }
  };

  const handleSaveFile = useCallback(async () => {
    const result = await modelController.files.save();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openSaveError(cause);
      }
    } else {
      toast.success('Схема сохранена!');
    }
  }, [model, openSaveError]);

  const handleImportFile = async (
    setOpenData: Dispatch<[boolean, string | null, string | null, string]>
  ) => {
    if (isStale) {
      setData({
        shownName: name,
        question: 'Хотите сохранить файл перед тем, как импортировать новый?',
        // "Не сохранять"
        // Модальное окно закроется автоматически и откроется окно выбора файла.
        onConfirm: async () => await performImportFile(setOpenData),
        onSave: handleSaveFile,
        /* 
          "Сохранить".
          модальное окно само не закроется после выбора пути для сохранения,
          только после выбора файла для импорта, поэтому закрываем сами,
          чтобы пользователь не подумал, что что-то зависло
        */
        onOpen: async () => {
          onClose();
          await performImportFile(setOpenData);
        },
      });
      openSaveModal();
    } else {
      performImportFile(setOpenData);
    }
  };

  const performImportFile = async (
    setOpenData?: Dispatch<[boolean, string | null, string | null, string]>
  ) => {
    if (setOpenData) {
      const result = await modelController.files.import(setOpenData);
      if (result) {
        Compiler.setCompilerData(undefined);
        clearTabs();
        openTabs();
      }
    }
  };

  const initImportData = (
    importData: Elements,
    openData: [boolean, string | null, string | null, string]
  ) => {
    const result = modelController.files.initImportData(importData, openData);
    if (result) {
      Compiler.setCompilerData(undefined);
      clearTabs();
      openTabs();
    }
  };

  const loadGraphml = (graphml: string) => {
    const parsedData = importGraphml(graphml, openImportError);
    if (parsedData === undefined) {
      return false;
    }
    modelController.initData(null, 'Без названия', parsedData, true);
    openTabs();
    return true;
  };

  /**
   * Временное сохранение схемы в localstorage
   */
  const tempSave = () => {
    window.localStorage.setItem(tempSaveKey, modelController.model.serializer.getAll('Cyberiada'));
  };

  const loadTempSave = () => {
    return window.localStorage.getItem(tempSaveKey);
  };

  const deleteTempSave = () => {
    window.localStorage.removeItem(tempSaveKey);
  };

  useEffect(() => {
    //Сохранение документа после закрытия редактора
    const unsubscribe = window.electron.ipcRenderer.on('app-close', () => {
      if (isStale) {
        setData({
          shownName: name,
          question: 'Хотите сохранить документ перед тем, как закрыть приложение?',
          //При нажатии на любую из кнопок, он должен закрывать редактор
          onConfirm: () => {
            return window.electron.ipcRenderer.send('closed');
          },
          onSave: handleSaveFile,
          onOpen: () => {
            return window.electron.ipcRenderer.send('closed');
          },
        });
        openSaveModal();
      } else {
        window.electron.ipcRenderer.send('closed');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [handleSaveFile, model]);

  return {
    saveModalProps: { isOpen, onClose, data, deleteTempSave },
    operations: {
      onRequestNewFile: handleNewFile,
      onRequestOpenFile: handleOpenFile,
      onRequestSaveFile: handleSaveFile,
      onRequestSaveAsFile: handleSaveAsFile,
      onRequestImportFile: handleImportFile,
    },
    initImportData,
    performNewFile,
    handleOpenFromTemplate,
    tempSaveOperations: {
      tempSave,
      loadTempSave,
      deleteTempSave,
    },
    loadGraphml,
  };
};
