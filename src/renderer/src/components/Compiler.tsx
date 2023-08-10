import { CompilerResult } from '@renderer/types/CompilerTypes';
import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CompilerProps {
  compilerData: CompilerResult | undefined,
  compilerStatus: string,
  fileReady: boolean,
  handleCompile: () => void;
  handleAddStdoutTab: () => void;
  handleAddStderrTab: () => void;
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


export const Compiler: React.FC<CompilerProps> = ({compilerData, compilerStatus, fileReady, handleCompile, handleAddStdoutTab, handleAddStderrTab}) => {
  const handle = async () => {
    console.log("biba")
  }

  return (
    <section className="flex h-full flex-col bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компилятор</h1>
      </div>
      {

        <button disabled={compilerStatus == "Не подключен" || compilerStatus == "Идет компиляция..." || !fileReady} 
                className={twMerge("my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white", 
                                    (compilerStatus == "Не подключен" || compilerStatus == "Идет компиляция..." || !fileReady)  && "opacity-50")} 
                onClick={handleCompile}>
          Скомпилировать
        </button> 
      }
      <div className="h-full select-text overflow-y-auto break-words rounded bg-white p-2">
        Статус: {compilerStatus}
        <br></br>
        <br></br>
        Результат компиляции:{ compilerData ? compilerData.result: "Нет данных"}
      </div>
      <button
          className={twMerge("my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white", 
          (compilerData?.stderr === undefined) && "opacity-50")}
          onClick={handleAddStderrTab}
          disabled={compilerData?.stderr === undefined}
        >
          Показать stderr
      </button>
      <button
          className={twMerge("my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white", 
          (compilerData?.stdout === undefined) && "opacity-50")}
          disabled={compilerData?.stdout === undefined}
          onClick={handleAddStdoutTab}
        >
          Показать stdout
      </button>
      {button.map(({ name }, i) => (
        <button
          key={'compiler' + i}
          className={twMerge("my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white", 
          (compilerData?.binary === undefined || compilerData.binary.length == 0) && "border-[#557b91] opacity-50")}
          onClick={handle}
          disabled={compilerData?.binary === undefined}
        >
          {name}
        </button>
      ))}
    </section>
  );
};
