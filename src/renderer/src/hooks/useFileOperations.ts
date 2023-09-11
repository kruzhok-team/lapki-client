import { useState } from 'react';

import { SaveModalData } from '@renderer/components';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { isLeft, isRight, unwrapEither } from '@renderer/types/Either';
import { useTabs } from '@renderer/store/useTabs';

interface useFileOperationsArgs {
  manager: EditorManager;
  openLoadError: (cause: any) => void;
  openSaveError: (cause: any) => void;
  openPlatformModal: () => void;
}

export const useFileOperations = (args: useFileOperationsArgs) => {
  const { manager, openLoadError, openSaveError, openPlatformModal } = args;

  const isStale = manager.useData('isStale');
  const name = manager.useData('name');

  const clearTabs = useTabs((state) => state.clearTabs);

  const [data, setData] = useState<SaveModalData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const openSaveModal = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  /*Открытие файла*/
  const handleOpenFile = async () => {
    if (isStale) {
      setData({
        shownName: name,
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

    if (result && isRight(result)) {
      clearTabs();
    }
  };
  //Создание нового файла
  const handleNewFile = async () => {
    if (isStale) {
      setData({
        shownName: name,
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
    clearTabs();
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

  return {
    saveModalProps: { isOpen, onClose, data },
    operations: {
      onRequestNewFile: handleNewFile,
      onRequestOpenFile: handleOpenFile,
      onRequestSaveFile: handleSaveFile,
      onRequestSaveAsFile: handleSaveAsFile,
    },
    performNewFile,
  };
};
