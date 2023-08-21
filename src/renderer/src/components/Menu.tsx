import React from 'react';

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestImport: (platform: string) => void;
  compilerStatus: string;
  // TODO: isModified: boolean;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const items = [
    {
      text: 'Создать...',
      onClick: props.onRequestNewFile,
      disabled: false,
    },
    {
      text: 'Открыть...',
      onClick: props.onRequestOpenFile,
      disabled: false,
    },
    {
      text: 'Сохранить',
      onClick: props.onRequestSaveFile,
      // TODO: disabled: !props.isModified,
      disabled: false,
    },
    {
      text: 'Сохранить как...',
      onClick: props.onRequestSaveAsFile,
      disabled: false,
    },
    {
      text: 'Импорт...',
      onClick: () => {
        props.onRequestImport('BearlogaDefend');
      },
      disabled: props.compilerStatus !== 'Подключен',
    },
    /*
    {
      text: 'Примеры',
      // TODO: модальное окно с выбором примера
    },
    */
  ];

  return (
    <section key="SectionMenu" className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">Меню</h3>

      {items.map(({ text, onClick, disabled }) => (
        <button
          key={text}
          className="py-2 text-center text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled"
          onClick={onClick}
          disabled={disabled}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
