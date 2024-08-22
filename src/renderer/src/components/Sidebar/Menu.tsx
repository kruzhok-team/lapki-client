import React, { Dispatch, useLayoutEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { PropertiesModal, TextModeModal } from '@renderer/components';
import { useModal } from '@renderer/hooks/useModal';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useTabs } from '@renderer/store/useTabs';

interface MenuItem {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
}

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestImport: (setOpenData: Dispatch<[boolean, string | null, string | null, string]>) => void;
  compilerStatus: string;
  setOpenData: Dispatch<[boolean, string | null, string | null, string]>;
  // TODO: isModified: boolean;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const { model } = useEditorContext();

  const isStale = model.useData('isStale');
  const isInitialized = model.useData('isInitialized');
  const isMounted = model.useData('isMounted');
  const visual = model.useData('elements.visual');

  const [isPropertiesModalOpen, openPropertiesModal, closePropertiesModal] = useModal(false);
  const [isTextModeModalOpen, openTextModeModal, closeTextModeModal] = useModal(false);

  const openTab = useTabs((state) => state.openTab);

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
      text: 'Сохранить',
      onClick: props.onRequestSaveFile,
      disabled: !isStale || !isInitialized,
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
    {
      text: 'Открыть редактор',
      onClick: () => {
        openTab({ type: 'editor', name: 'editor' });
      },
      disabled: !isInitialized || isMounted,
      // Отделение кнопки для работы с холстом от кнопок для работы с файлом схемы
      className: 'border-t border-border-primary',
    },
    {
      text: 'Перейти в текстовый режим (β)',
      onClick: () => openTextModeModal(),
      hidden: !visual || !isInitialized,
    },
    // {
    //   text: 'Примеры',
    //   TODO: модальное окно с выбором примера
    // },
  ];

  useLayoutEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.code === 'KeyN') {
        return props.onRequestNewFile();
      }
      if (e.code === 'KeyO') {
        return props.onRequestOpenFile();
      }
      if (e.code === 'KeyI') {
        return props.onRequestImport(props.setOpenData);
      }
    }
  };

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Документ
      </h3>

      {items.map(({ text, onClick, disabled = false, hidden = false, className }) => (
        <button
          key={text}
          className={twMerge(
            'px-2 py-2 text-center text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled',
            className
          )}
          onClick={onClick}
          disabled={disabled}
          hidden={hidden}
        >
          {text}
        </button>
      ))}

      <PropertiesModal isOpen={isPropertiesModalOpen} onClose={closePropertiesModal} />
      <TextModeModal isOpen={isTextModeModalOpen} onClose={closeTextModeModal} />
    </section>
  );
};
