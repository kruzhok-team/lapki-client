import React, { useLayoutEffect } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestImport: (platform: string) => void;
  compilerStatus: string;
  editor: CanvasEditor | null;
  // TODO: isModified: boolean;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const items = [
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
      disabled: props.editor ? false : true,
      // TODO: disabled: !props.isModified,
    },
    {
      text: 'Сохранить как...',
      onClick: props.onRequestSaveAsFile,
      disabled: props.editor ? false : true,
    },
    {
      text: 'Импорт...',
      onClick: () => {
        props.onRequestImport('BearlogaDefend');
      },
      disabled: props.compilerStatus !== 'Подключен',
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
        return props.onRequestImport('BearlogaDefend');
      }
    }
  };

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">Меню</h3>

      {items.map(({ text, onClick, disabled = false }) => (
        <button
          key={text}
          className="px-2 py-2 text-center text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled"
          onClick={onClick}
          disabled={disabled}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
