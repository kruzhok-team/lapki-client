import React, { Dispatch, useLayoutEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { PropertiesModal, TextModeModal } from '@renderer/components';
import { useModal } from '@renderer/hooks/useModal';
import { useProperties } from '@renderer/hooks/useProperties';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { noTextMode } from '@renderer/version';

import { OpenRecentModal } from '../OpenRecentModal';
import { Badge, WithHint } from '../UI';

interface MenuItem {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
  badge?: boolean;
  hint?: string;
}

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: (path?: string) => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestImport: (setOpenData: Dispatch<[boolean, string | null, string | null, string]>) => void;
  compilerStatus: string;
  setOpenData: Dispatch<[boolean, string | null, string | null, string]>;
  // TODO: isModified: boolean;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const [openTab, activeTabName, tabs] = useTabs((state) => [
    state.openTab,
    state.activeTab,
    state.items,
  ]);
  const activeTab = tabs.find((tab) => tab.name === activeTabName);
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const isStale = modelController.model.useData('', 'isStale');
  const isInitialized = modelController.model.useData('', 'isInitialized');
  const { propertiesModalProps, openPropertiesModal } = useProperties(controller);
  const [isTextModeModalOpen, openTextModeModal, closeTextModeModal] = useModal(false);
  const [isRecentModalOpen, openRecentModal, closeRecentModal] = useModal(false);
  const visual = controller.useData('visual');

  const items: MenuItem[] = [
    {
      text: 'Создать...',
      onClick: props.onRequestNewFile,
    },
    {
      text: 'Открыть...',
      onClick: () => props.onRequestOpenFile(), // Если передавать просто функцию, в параметры может попасть то что не нужно
    },
    {
      text: 'Открыть недавние...',
      onClick: () => openRecentModal(), // Если передавать просто функцию, в параметры может попасть то что не нужно
    },
    {
      text: 'Сохранить',
      onClick: props.onRequestSaveFile,
      disabled: !isStale || !isInitialized,
      badge: isStale && isInitialized,
      hint: isStale && isInitialized ? 'Есть несохранённые изменения' : '',
    },
    {
      text: 'Сохранить как...',
      onClick: props.onRequestSaveAsFile,
      disabled: !isInitialized,
    },
    {
      text: 'Импорт...',
      onClick: () => {
        props.onRequestImport(props.setOpenData);
      },
      disabled: props.compilerStatus !== 'Подключен',
    },
    {
      text: 'Свойства',
      onClick: openPropertiesModal,
      disabled: !isInitialized,
    },
    // {
    //   text: 'Открыть редактор',
    //   onClick: () => {
    //     // openTab({ type: 'editor', name: 'editor' });
    //   },
    //   disabled: !isInitialized,
    //   // Отделение кнопки для работы с холстом от кнопок для работы с файлом схемы
    //   className: 'border-t border-border-primary',
    // },
    {
      text: 'Схемоэкран',
      onClick: () => {
        const schemeEditorId = modelController.schemeEditorId;
        if (!schemeEditorId) return;
        const controller = modelController.controllers[schemeEditorId];
        if (!controller) return;
        openTab(modelController, {
          type: 'editor',
          canvasId: schemeEditorId,
          name: 'Схемоэкран',
        });
        modelController.model.changeHeadControllerId(schemeEditorId);
      },
      disabled: !isInitialized,
      hidden: controller.type === 'scheme',
    },
    {
      text: 'Текстовый режим (β)',
      onClick: () => openTextModeModal(),
      hidden:
        noTextMode ||
        !visual ||
        !isInitialized ||
        controller.type === 'scheme' ||
        (activeTab && activeTab.type !== 'editor') ||
        Object.values(controller.platform).find((platform) =>
          platform.data.id.startsWith('BearlogaDefend')
        ) !== undefined,
    },
    // {
    //   text: 'Примеры',
    //   TODO: модальное окно с выбором примера
    // },
  ];
  // TODO (L140-beep): переместить в MainContainer.tsx
  useLayoutEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  const handleKeyUp = async (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.code === 'KeyN') {
        return props.onRequestNewFile();
      }
      if (e.code === 'KeyZ') {
        return modelController.history.undo();
      }
      if (e.code === 'KeyY') {
        return modelController.history.redo();
      }
      if (!e.shiftKey && e.code === 'KeyS') {
        return await modelController.files.save();
      }
      if (e.shiftKey && e.code === 'KeyS') {
        return await modelController.files.saveAs();
      }
      if (e.code === 'KeyO') {
        return props.onRequestOpenFile();
      }
      if (e.code === 'KeyI') {
        return props.onRequestImport(props.setOpenData);
      }
      if (e.shiftKey && e.code === 'F12') {
        window.electron.ipcRenderer.invoke('devtools-switch');
      }
    }
  };

  const renderButton = (
    text: string,
    onClick: () => void,
    disabled: boolean,
    hidden: boolean,
    className?: string,
    badge?: boolean,
    props?: Record<string, any>
  ) => {
    return (
      <button
        key={text}
        className={twMerge(
          'px-2 py-2 text-left indent-4 text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled',
          className
        )}
        {...props}
        onClick={onClick}
        disabled={disabled}
        hidden={hidden}
      >
        <Badge show={badge ?? false}>{text}</Badge>
      </button>
    );
  };

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Документ
      </h3>

      {items.map(({ text, onClick, disabled = false, hidden = false, className, badge, hint }) => {
        if (hint) {
          return (
            <WithHint key={text} hint={hint ?? ''}>
              {(props) => renderButton(text, onClick, disabled, hidden, className, badge, props)}
            </WithHint>
          );
        } else {
          return renderButton(text, onClick, disabled, hidden, className, badge);
        }
      })}

      <PropertiesModal {...propertiesModalProps} />
      <TextModeModal isOpen={isTextModeModalOpen} onClose={closeTextModeModal} />
      <OpenRecentModal
        isOpen={isRecentModalOpen}
        onClose={closeRecentModal}
        onSubmit={(filePath) => props.onRequestOpenFile(filePath)}
      />
    </section>
  );
};
