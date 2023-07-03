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
    {
      text: 'Закрыть программу',
    },
  ];

  return (
    <section className="flex w-full flex-col items-stretch bg-[#4391BF] bg-opacity-50">
      <p className="text-center font-Fira text-base">Меню</p>

      {items.map(({ text, onClick }) => (
        <button
          className="bg-[#4391BF] bg-opacity-50 p-4 text-center font-Fira text-base"
          onClick={onClick}
        >
          {text}
        </button>
      ))}
    </section>
  );
};
