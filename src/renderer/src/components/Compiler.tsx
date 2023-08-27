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
  handleShowSource: () => void;
  handleFlashButton: () => void;
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
  handleShowSource,
  handleFlashButton,
}) => {
  const button = [
    {
      name: 'Показать stderr',
      handler: handleAddStderrTab,
      disabled: compilerData?.stderr === undefined,
    },
    {
      name: 'Показать stdout',
      handler: handleAddStdoutTab,
      disabled: compilerData?.stdout === undefined,
    },
    {
      name: 'Сохранить результат',
      handler: handleSaveBinaryIntoFolder,
      disabled: compilerData?.binary === undefined || compilerData.binary.length == 0,
    },
    {
      name: 'Сохранить код',
      handler: handleSaveSourceIntoFolder,
      disabled: compilerData?.source == undefined || compilerData?.source.length == 0,
    },
    {
      name: 'Показать код',
      handler: handleShowSource,
      condition: compilerData?.source == undefined || compilerData?.source.length == 0,
    },
    {
      name: 'Прошить...',
      handler: handleFlashButton,
      disabled: compilerData?.binary === undefined || compilerData.binary.length == 0,
    },
  ];
  const cantCompile =
    compilerStatus == 'Не подключен' || compilerStatus == 'Идет компиляция...' || !fileReady;
  const disabled = cantCompile;

  return (
    <section>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Компилятор
      </h3>

      <div className="flex flex-col px-4">
        <button disabled={disabled} className="btn-primary mb-4" onClick={handleCompile}>
          Скомпилировать
        </button>

        <p>
          Статус:{' '}
          <span
            className={twMerge('text-success', compilerStatus === 'Не подключен' && 'text-error')}
          >
            {compilerStatus}
          </span>
        </p>

        <div className="mb-4 min-h-[350px] select-text overflow-y-auto break-words rounded bg-bg-primary p-2">
          Результат компиляции: {compilerData ? compilerData.result : 'Нет данных'}
        </div>

        {button.map(({ name, handler, disabled }, i) => (
          <button key={i} className="btn-primary mb-2" onClick={handler} disabled={disabled}>
            {name}
          </button>
        ))}
      </div>
    </section>
  );
};
