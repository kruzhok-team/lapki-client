import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Compiler } from '@renderer/components/Modules/Compiler';
import { Settings } from '@renderer/components/Modules/Settings';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { useSidebar } from '@renderer/store/useSidebar';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';

export interface CompilerProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  openData: [boolean, string | null, string | null, string] | undefined;
  compilerData: CompilerResult | undefined;
  setCompilerData: React.Dispatch<React.SetStateAction<CompilerResult | undefined>>;
  compilerStatus: string;
  setCompilerStatus: React.Dispatch<React.SetStateAction<string>>;
  openImportError: (error: string) => void;
}

export const CompilerTab: React.FC<CompilerProps> = ({
  manager,
  openData,
  compilerData,
  setCompilerData,
  compilerStatus,
  setCompilerStatus,
  openImportError,
}) => {
  const [setImportData] = useState<string | undefined>(undefined);

  const openTab = useTabs((state) => state.openTab);
  const changeSidebarTab = useSidebar((state) => state.changeTab);

  const name = manager.useData('name');
  const isInitialized = manager.useData('isInitialized');

  const handleFlashButton = () => {
    // TODO: индекс должен браться из какой-то переменной
    changeSidebarTab(3);
  };

  const handleSaveBinaryIntoFolder = async () => {
    const preparedData = await Compiler.prepareToSave(compilerData!.binary!);
    manager.saveIntoFolder(preparedData);
  };

  const handleCompile = async () => {
    if (!name) return;

    Compiler.filename = name;
    manager.compile();
  };

  const handleSaveSourceIntoFolder = async () => {
    await manager.saveIntoFolder(compilerData!.source!);
  };

  const handleAddStdoutTab = () => {
    openTab({
      type: 'code',
      name: 'stdout',
      code: compilerData!.stdout ?? '',
      language: 'txt',
    });
  };

  const handleAddStderrTab = () => {
    openTab({
      type: 'code',
      name: 'stderr',
      code: compilerData!.stderr ?? '',
      language: 'txt',
    });
  };

  const handleShowSource = () => {
    compilerData!.source!.forEach((element) => {
      openTab({
        type: 'code',
        name: `${element.filename}.${element.extension}`,
        code: element.fileContent,
        language: 'cpp',
      });
    });
  };

  const handleReconnect = () => {
    Compiler.reconnect();
  };

  useEffect(() => {
    if (openData) {
      manager.parseImportData(openData!, openImportError);
      setImportData(undefined);
    }
  }, [manager, openData]);

  useEffect(() => {
    Compiler.bindReact(setCompilerData, setCompilerStatus, setImportData);
    Settings.getCompilerSettings().then((compiler) => {
      console.log('CONNECTING TO COMPILER');
      Compiler.connect(compiler.host, compiler.port);
    });
  }, []);

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
      disabled: compilerData?.source == undefined || compilerData?.source.length == 0,
    },
    {
      name: 'Прошить...',
      handler: handleFlashButton,
      disabled: compilerData?.binary === undefined || compilerData.binary.length == 0,
    },
  ];
  const cantCompile =
    compilerStatus == 'Не подключен' || compilerStatus == 'Идет компиляция...' || !isInitialized;
  const disabled = cantCompile;
  const connecting = compilerStatus == 'Идет подключение...';

  return (
    <section>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Компилятор
      </h3>

      <div className="flex flex-col px-4">
        <button
          disabled={compilerStatus != 'Не подключен' ? disabled : connecting}
          className="btn-primary mb-4 flex justify-center"
          onClick={compilerStatus != 'Не подключен' ? handleCompile : handleReconnect}
        >
          {compilerStatus != 'Не подключен' ? 'Скомпилировать' : 'Переподключиться'}
        </button>

        <p>
          Статус:{' '}
          <span
            className={twMerge('text-primary', compilerStatus === 'Не подключен' && 'text-error')}
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
