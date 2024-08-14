import { useState, useEffect, Dispatch } from 'react';

import { SaveModalData } from '@renderer/components';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useTabs } from '@renderer/store/useTabs';
import { isLeft, isRight, unwrapEither } from '@renderer/types/Either';

interface useFileOperationsArgs {
  openLoadError: (cause: any) => void;
  openSaveError: (cause: any) => void;
  openCreateSchemeModal: () => void;
  openImportError: (error: string) => void;
}

export const useFileOperations = (args: useFileOperationsArgs) => {
  const { openLoadError, openSaveError, openCreateSchemeModal, openImportError } = args;

  const editor = useEditorContext();
  const model = editor.model;
  // (Roundabout1) Константы были заменены на прямое обращение к полям model, потому что, иначе будет отсутствовать синхронизация, то есть
  // эти константы будут выдавать неактуальные значения (точно известно, что isStale не актуален, насчёт name - неизвестно).
  // Не понятно насколько надёжно это решение.
  //const isStale = model.useData('isStale');
  //const name = model.useData('name');

  const [clearTabs, openTab] = useTabs((state) => [state.clearTabs, state.openTab]);

  const [data, setData] = useState<SaveModalData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const openSaveModal = () => setIsOpen(true);
  const onClose = () => {
    window.electron.ipcRenderer.send('reset-close');
    setIsOpen(false);
  };

  /*Открытие файла*/
  const handleOpenFile = async (path?: string) => {
    if (model.data.isStale) {
      setData({
        shownName: model.data.name,
        question: 'Хотите сохранить файл перед тем, как открыть другой?',
        onConfirm: performOpenFile,
        onSave: handleSaveFile,
        onOpen: async () => await performOpenFile(path),
      });
      openSaveModal();
    } else {
      await performOpenFile(path);
    }
  };

  const performOpenFile = async (path?: string) => {
    const result = await model?.files.open(openImportError, path);

    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openLoadError(cause);
      }
    }

    if (result && isRight(result)) {
      clearTabs();
      openTab({ type: 'editor', name: 'editor' });
    }
  };

  const handleOpenFromTemplate = async (type: string, name: string) => {
    await model.files.createFromTemplate(type, name, openImportError);

    clearTabs();
    openTab({ type: 'editor', name: 'editor' });
  };

  //Создание нового файла
  const handleNewFile = async () => {
    if (model.data.isStale) {
      setData({
        shownName: model.data.name,
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

  const performNewFile = (idx: string) => {
    model?.files.newFile(idx);
    clearTabs();
    openTab({ type: 'editor', name: 'editor' });
  };

  const handleSaveAsFile = async () => {
    const result = await model?.files.saveAs();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openSaveError(cause);
      }
    }
  };

  const handleSaveFile = async () => {
    const result = await model?.files.save();
    if (result && isLeft(result)) {
      const cause = unwrapEither(result);
      if (cause) {
        openSaveError(cause);
      }
    } else {
      // TODO: информировать об успешном сохранении
    }
  };

  const handleImportFile = async (
    setOpenData: Dispatch<[boolean, string | null, string | null, string]>
  ) => {
    if (model.data.isStale) {
      setData({
        shownName: model.data.name,
        question: 'Хотите сохранить файл перед тем, как импортировать новый?',
        onConfirm: performImportFile,
        onSave: handleSaveFile,
        onOpen: async () => await performImportFile(setOpenData),
      });
    } else {
      performImportFile(setOpenData);
    }
  };

  const performImportFile = async (
    setOpenData?: Dispatch<[boolean, string | null, string | null, string]>
  ) => {
    console.log('import');
    if (setOpenData) {
      const result = await model?.files.import(setOpenData);
      if (result) {
        clearTabs();
        openTab({ type: 'editor', name: 'editor' });
      }
    }
  };

  useEffect(() => {
    //Сохранение проекта после закрытия редактора
    const unsubscribe = window.electron.ipcRenderer.on('app-close', () => {
      if (model.data.isStale) {
        setData({
          shownName: model.data.name,
          question: 'Хотите сохранить проект перед тем, как закрыть приложение?',
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
  }, [handleSaveFile, model.data.isStale, model.data.name]);

  return {
    saveModalProps: { isOpen, onClose, data },
    operations: {
      onRequestNewFile: handleNewFile,
      onRequestOpenFile: handleOpenFile,
      onRequestSaveFile: handleSaveFile,
      onRequestSaveAsFile: handleSaveAsFile,
      onRequestImportFile: handleImportFile,
    },
    performNewFile,
    handleOpenFromTemplate,
  };
};
