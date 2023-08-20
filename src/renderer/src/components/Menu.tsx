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
  console.log(props.compilerStatus);
  console.log(props.compilerStatus !== 'Подключен');
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
      text: 'Импорт',
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
    <section
      key="SectionMenu"
      className="flex h-full w-full flex-col items-stretch bg-[#a1c8df] font-Fira"
    >
      <div className="w-full px-4 pt-2 text-center">
        <p className="mb-3 border-b border-white pb-2 text-lg">Меню</p>
      </div>
      {items.map(({ text, onClick, disabled }) => (
        <button
          key={text}
          className="bg-opacity-50 py-2 text-center text-base enabled:hover:bg-[#4391BF] disabled:text-gray-400"
          onClick={onClick}
          disabled={disabled}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
