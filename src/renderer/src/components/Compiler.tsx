import React from 'react';

const button = [
  {
    name: 'Сохранить артефакт',
  },
  {
    name: 'Сохранить код',
  },
  {
    name: 'Показать код',
  },
  {
    name: 'Прошить...',
  },
];

export const Compiler: React.FC = ({}) => {
  return (
    <section className="flex h-full flex-col bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компилятор</h1>
      </div>
      <button className="my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white">
        Скомпилировать
      </button>
      <div className="h-full select-text overflow-y-auto break-words rounded bg-white p-2">
        Текст был создан ради проверки, чтобы не портить малину с переносом
        <br />
        Текст был создан ради проверки, чтобы не портить малину с переносом
        <br />
        Текст был создан ради проверки, чтобы не портить малину с переносом
        <br />
        Текст был создан ради проверки, чтобы не портить малину с переносом
        <br />
        Текст был создан ради проверки, чтобы не портить малину с переносом
        <br />
      </div>
      {button.map(({ name }, i) => (
        <button
          key={'compiler' + i}
          className="my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white"
        >
          {name}
        </button>
      ))}
    </section>
  );
};
