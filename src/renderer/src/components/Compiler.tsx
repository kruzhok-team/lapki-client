import { CompilerResult } from '@renderer/types/CompilerTypes';
import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CompilerProps {
  compilerData: CompilerResult | undefined;
  compilerStatus: string;
  handleCompile: () => void;
}

const button = [
  {
    name: 'Сохранить артефакт',
    handler: () => void {},
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

export const Compiler: React.FC<CompilerProps> = ({
  compilerData,
  compilerStatus,
  handleCompile,
}) => {
  var disabled = false;
  var style = 'my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white';
  if (compilerStatus == 'Не подключен') {
    disabled = true;
    style = 'my-2 rounded border-2 border-[#557b91] p-2 bg-[#425f70] text-white opacity-50';
  }
  return (
    <section className="flex h-full flex-col bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компилятор</h1>
      </div>
      {/*Если не подключен - заблокировать кнопки*/}
      {
        <button disabled={disabled} className={style} onClick={handleCompile}>
          Скомпилировать
        </button>
      }
      <div>
        Статус:{' '}
        <a className={twMerge('text-[green]', compilerStatus === 'Не подключен' && 'text-[red]')}>
          {compilerStatus}
        </a>
      </div>
      <div className="my-2 h-full select-text overflow-y-auto break-words rounded bg-white p-2">
        Результат компиляции: {compilerData ? compilerData.result : 'Нет данных'}
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
