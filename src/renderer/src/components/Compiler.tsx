import { CompilerResult } from '@renderer/types/CompilerTypes';
import React from 'react';

export interface CompilerProps {
  compilerData: CompilerResult | string | undefined,
  compilerStatus: string,
  handleCompile: () => void,
}

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

export const Compiler: React.FC<CompilerProps> = ({compilerData, compilerStatus, handleCompile}) => {
  return (
    <section className="flex h-full flex-col bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компилятор</h1>
      </div>
      <button className="my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white" onClick={handleCompile}>
        Скомпилировать
      </button>
      <div className="h-full select-text overflow-y-auto break-words rounded bg-white p-2">
        Статус: {compilerStatus}
        <br></br>
        <br></br>
        Результат компиляции: { compilerData ? compilerData.toString(): "Нет данных"}
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
