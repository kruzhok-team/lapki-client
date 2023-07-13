import React from 'react';

interface MenuProps {
  onRequestOpenFile: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onRequestOpenFile }) => {
  const items = [
    {
      text: 'Открыть файл',
      onClick: onRequestOpenFile,
    },
    {
      text: 'Сохранить файл',
    },
    {
      text: 'Сохранить файл как...',
    },
    {
      text: 'Примеры',
    },
  ];

  return (
    <section
      key="SectionMenu"
      className="flex h-full w-full flex-col items-stretch bg-[#4391BF] bg-opacity-50"
    >
      <p className="py-2 text-center font-Fira text-base">Меню</p>

      {items.map(({ text, onClick }) => (
        <button
          key={text}
          className="bg-[#4391BF] bg-opacity-50 py-2 text-center font-Fira text-base"
          onClick={onClick}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
