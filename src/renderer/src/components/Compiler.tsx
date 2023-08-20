import { CompilerResult } from '@renderer/types/CompilerTypes';
import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CompilerProps {
  compilerData: CompilerResult | undefined;
  compilerStatus: string;
  fileReady: boolean;
  handleCompile: () => void;
  handleAddStdoutTab: () => void;
  handleAddStderrTab: () => void;
  handleSaveSourceIntoFolder: () => void;
  handleSaveBinaryIntoFolder: () => void;
}

export const Compiler: React.FC<CompilerProps> = ({
  compilerData,
  compilerStatus,
  fileReady,
  handleCompile,
  handleAddStdoutTab,
  handleAddStderrTab,
  handleSaveSourceIntoFolder,
  handleSaveBinaryIntoFolder,
}) => {
  const button = [
    {
      name: 'Сохранить результат',
      handler: handleSaveBinaryIntoFolder,
    },
    {
      name: 'Сохранить код',
      handler: handleSaveSourceIntoFolder,
    },
    {
      name: 'Показать код',
      handler: () => {
        console.log('click');
      },
    },
    {
      name: 'Прошить...',
      handler: () => {
        console.log('click');
      },
    },
  ];
  const cantCompile =
    compilerStatus == 'Не подключен' || compilerStatus == 'Идет компиляция...' || !fileReady;
  const disabled = cantCompile;
  const style = twMerge(
    'my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white',
    cantCompile && 'opacity-50'
  );

  return (
    <section className="flex h-full flex-col bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компилятор</h1>
      </div>
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
      <button
        className={twMerge(
          'my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white',
          compilerData?.stderr === undefined && 'opacity-50'
        )}
        onClick={handleAddStderrTab}
        disabled={compilerData?.stderr === undefined}
      >
        Показать stderr
      </button>
      <button
        className={twMerge(
          'my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white',
          compilerData?.stdout === undefined && 'opacity-50'
        )}
        disabled={compilerData?.stdout === undefined}
        onClick={handleAddStdoutTab}
      >
        Показать stdout
      </button>
      {button.map(({ name, handler }, i) => (
        <button
          key={'compiler' + i}
          className={twMerge(
            'my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white',
            (compilerData?.binary === undefined || compilerData.binary.length == 0) &&
              'border-[#557b91] opacity-50'
          )}
          onClick={handler}
          disabled={compilerData?.binary === undefined}
        >
          {name}
        </button>
      ))}
    </section>
  );
};
