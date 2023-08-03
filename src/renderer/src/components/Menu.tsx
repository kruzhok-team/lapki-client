import React from 'react';

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  // TODO: isModified: boolean;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const items = [
    {
      text: 'Новая схема',
      onClick: props.onRequestNewFile,
    },
    {
      text: 'Открыть...',
      onClick: props.onRequestOpenFile,
    },
    {
      text: 'Сохранить',
      onClick: props.onRequestSaveFile,
      // TODO: disabled: !props.isModified,
    },
    {
      text: 'Сохранить как...',
      onClick: props.onRequestSaveAsFile,
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
      className="flex h-full w-full flex-col items-stretch bg-[#4391BF] bg-opacity-50 font-Fira"
    >
      <div className="w-full px-4 pt-2 text-center">
        <p className="mb-3 border-b border-white pb-2 text-lg">Меню</p>
      </div>
      {items.map(({ text, onClick }) => (
        <button
          key={text}
          className="bg-opacity-50 py-2 text-center text-base enabled:hover:bg-[#4391BF] disabled:text-gray-400"
          onClick={onClick}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
