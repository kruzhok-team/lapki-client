import React, { useLayoutEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { PropertiesModal } from '@renderer/components';
import { useModal } from '@renderer/hooks/useModal';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useTabs } from '@renderer/store/useTabs';

interface MenuItem {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestImport: () => void;
  compilerStatus: string;
  // TODO: isModified: boolean;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const { model } = useEditorContext();

  const isStale = model.useData('isStale');
  const isInitialized = model.useData('isInitialized');
  const isMounted = model.useData('isMounted');

  const [isPropertiesModalOpen, openPropertiesModalOpen, closePropertiesModalOpen] =
    useModal(false);

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
      disabled: !isStale || !isInitialized,
    },
    {
      text: 'Импорт...',
      onClick: () => {
        props.onRequestImport();
      },
      disabled: props.compilerStatus !== 'Подключен',
    },
    {
      text: 'Свойства',
      onClick: openPropertiesModalOpen,
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
        return props.onRequestImport();
      }
    }
  };

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Документ
      </h3>

      {items.map(({ text, onClick, disabled = false, className }) => (
        <button
          key={text}
          className={twMerge(
            'px-2 py-2 text-center text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled',
            className
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {text}
        </button>
      ))}

      <PropertiesModal isOpen={isPropertiesModalOpen} onClose={closePropertiesModalOpen} />
    </section>
  );
};
