import { useCallback, useLayoutEffect } from 'react';
import type { Dispatch } from 'react';

import { OpenRecentModal } from '@renderer/components/OpenRecentModal';
import { PropertiesModal } from '@renderer/components/PropertiesModal';
import { TextModeModal } from '@renderer/components/TextModeModal';
import { useModal } from '@renderer/hooks/useModal';
import { useProperties } from '@renderer/hooks/useProperties';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { noTextMode, noSchemeScreen } from '@renderer/version';

export type FileMenuItemId =
  | 'new'
  | 'open'
  | 'open-recent'
  | 'save'
  | 'save-as'
  | 'import'
  | 'properties'
  | 'scheme-screen'
  | 'text-mode';

export interface FileMenuItem {
  id: FileMenuItemId;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
  badge?: boolean;
  hint?: string;
}

interface UseFileMenuArgs {
  onRequestNewFile: () => void;
  onRequestOpenFile: (path?: string) => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestImport: (setOpenData: Dispatch<[boolean, string | null, string | null, string]>) => void;
  compilerStatus: string;
  setOpenData: Dispatch<[boolean, string | null, string | null, string]>;
}

export const useFileMenu = ({
  onRequestNewFile,
  onRequestOpenFile,
  onRequestSaveFile,
  onRequestSaveAsFile,
  onRequestImport,
  compilerStatus,
  setOpenData,
}: UseFileMenuArgs) => {
  const [nextTab, prevTab] = useTabs((state) => [state.nextTab, state.prevTab]);
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const isStale = modelController.model.useData('', 'isStale');
  const isInitialized = modelController.model.useData('', 'isInitialized');
  const { propertiesModalProps, openPropertiesModal } = useProperties();
  const [isTextModeModalOpen, openTextModeModal, closeTextModeModal] = useModal(false);
  const [isRecentModalOpen, openRecentModal, closeRecentModal] = useModal(false);
  const visual = controller.useData('visual');

  const handleNextTab = useCallback(() => nextTab(modelController), [modelController, nextTab]);

  const handlePrevTab = useCallback(() => prevTab(modelController), [modelController, prevTab]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code !== 'Tab') return;

      event.preventDefault();
      event.stopPropagation();
      if (event.ctrlKey && event.shiftKey) return handlePrevTab();
      if (event.ctrlKey) return handleNextTab();
    },
    [handleNextTab, handlePrevTab]
  );

  const handleKeyUp = useCallback(
    async (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;

      if (event.code === 'KeyN') return onRequestNewFile();
      if (event.code === 'KeyZ') return modelController.history.undo();
      if (event.code === 'KeyY') return modelController.history.redo();
      if (!event.shiftKey && event.code === 'KeyS') return await modelController.files.save();
      if (event.shiftKey && event.code === 'KeyS') return await modelController.files.saveAs();
      if (event.code === 'KeyO') return onRequestOpenFile();
      if (event.code === 'KeyI') return onRequestImport(setOpenData);
      if (event.shiftKey && event.code === 'F12') {
        window.electron.ipcRenderer.invoke('devtools-switch');
      }
    },
    [
      modelController.files,
      modelController.history,
      onRequestImport,
      onRequestNewFile,
      onRequestOpenFile,
      setOpenData,
    ]
  );

  useLayoutEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, handleKeyUp]);

  const items: FileMenuItem[] = [
    { id: 'new', text: 'Создать...', onClick: onRequestNewFile },
    { id: 'open', text: 'Открыть...', onClick: () => onRequestOpenFile() },
    { id: 'open-recent', text: 'Открыть недавние...', onClick: openRecentModal },
    {
      id: 'save',
      text: 'Сохранить',
      onClick: onRequestSaveFile,
      disabled: !isStale || !isInitialized,
      badge: isStale && isInitialized,
      hint: isStale && isInitialized ? 'Есть несохранённые изменения' : '',
    },
    {
      id: 'save-as',
      text: 'Сохранить как...',
      onClick: onRequestSaveAsFile,
      disabled: !isInitialized,
    },
    {
      id: 'import',
      text: 'Импорт...',
      onClick: () => onRequestImport(setOpenData),
      disabled: compilerStatus !== 'Подключен',
    },
    {
      id: 'properties',
      text: 'Свойства',
      onClick: openPropertiesModal,
      disabled: !isInitialized,
    },
    {
      id: 'scheme-screen',
      text: 'Схемоэкран',
      onClick: () => {
        const schemeEditorId = modelController.schemeEditorId;
        if (!schemeEditorId) return;
        const schemeController = modelController.controllers[schemeEditorId];
        if (!schemeController) return;
        modelController.changeHeadControllerId(schemeEditorId);
      },
      disabled: !isInitialized,
      hidden: noSchemeScreen || controller.type === 'scheme',
    },
    {
      id: 'text-mode',
      text: 'Текстовый режим (β)',
      onClick: openTextModeModal,
      hidden:
        noTextMode ||
        !visual ||
        !isInitialized ||
        controller.type === 'scheme' ||
        Object.values(controller.platform).find((platform) =>
          platform.data.id.startsWith('BearlogaDefend')
        ) !== undefined,
    },
  ];

  const modals = (
    <>
      <PropertiesModal {...propertiesModalProps} />
      <TextModeModal isOpen={isTextModeModalOpen} onClose={closeTextModeModal} />
      <OpenRecentModal
        isOpen={isRecentModalOpen}
        onClose={closeRecentModal}
        onSubmit={onRequestOpenFile}
      />
    </>
  );

  return { items, modals };
};
