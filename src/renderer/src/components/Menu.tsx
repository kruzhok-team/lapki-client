import React from 'react';

export interface MenuProps {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
}

export const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const items = [
    {
      text: 'Новый файл',
      onClick: props.onRequestNewFile,
    },
    {
      text: 'Открыть файл',
      onClick: props.onRequestOpenFile,
    },
    {
      text: 'Сохранить файл',
      onClick: props.onRequestSaveFile,
    },
    {
      text: 'Сохранить файл как...',
      onClick: props.onRequestSaveAsFile,
    },
    {
      text: 'Примеры',
    },
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
          className="bg-opacity-50 py-2 text-center text-base hover:bg-[#4391BF]"
          onClick={onClick}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
