import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useSidebar } from '@renderer/store/useSidebar';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import { languageMappers } from '@renderer/utils';

import { ServerSelectModal } from '../serverSelect/ServerSelectModal';

export interface CompilerProps {
  openData: [boolean, string | null, string | null, string] | undefined;
  compilerData: CompilerResult | undefined;
  setCompilerData: React.Dispatch<React.SetStateAction<CompilerResult | undefined>>;
  compilerStatus: string;
  setCompilerStatus: React.Dispatch<React.SetStateAction<string>>;
  openImportError: (error: string) => void;
}

export const CompilerTab: React.FC<CompilerProps> = ({
  openData,
  compilerData,
  setCompilerData,
  compilerStatus,
  setCompilerStatus,
}) => {
  const { model } = useEditorContext();

  const [compilerSetting] = useSettings('compiler');
  const [isCompilerOpen, openCompiler, closeCompiler] = useModal(false);
  const [importData, setImportData] = useState<string | undefined>(undefined);
  const openTab = useTabs((state) => state.openTab);
  const changeSidebarTab = useSidebar((state) => state.changeTab);

  const name = model.useData('name');
  const isInitialized = model.useData('isInitialized');

  const handleFlashButton = () => {
    // TODO: индекс должен браться из какой-то переменной
    changeSidebarTab(3);
  };

  const handleSaveBinaryIntoFolder = async () => {
    const preparedData = await Compiler.prepareToSave(compilerData!.binary!);
    model.files.saveIntoFolder(preparedData);
  };

  const handleCompile = async () => {
    if (!name) return;

    Compiler.filename = name;
    model.files.compile();
  };

  const handleSaveSourceIntoFolder = async () => {
    await model.files.saveIntoFolder(compilerData!.source!);
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
        language: languageMappers[element.extension] ?? element.extension,
      });
    });
  };

  const handleReconnect = () => {
    Compiler.reconnect();
  };

  useEffect(() => {
    if (importData && openData) {
      model.files.parseImportData(importData, openData!);
      setImportData(undefined);
    }
  }, [importData]);

  useEffect(() => {
    if (!compilerSetting) return;

    const { host, port } = compilerSetting;

    Compiler.bindReact(setCompilerData, setCompilerStatus, setImportData);
    Compiler.connect(host, port);
  }, [compilerSetting]);

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
  const processing =
    compilerStatus == 'Идет компиляция...' || compilerStatus == 'Идет подключение...';
  const canCompile = compilerStatus == 'Подключен' && isInitialized;
  return (
    <section>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Компилятор
      </h3>

      <div className="flex flex-col px-4">
        <div className="mb-2 flex rounded">
          <button
            disabled={
              processing || (!processing && !canCompile && compilerStatus != 'Не подключен')
            }
            className="btn-primary mr-2 flex w-full items-center justify-center gap-2 px-0"
            onClick={canCompile ? handleCompile : handleReconnect}
          >
            {compilerStatus != 'Не подключен' ? 'Скомпилировать' : 'Переподключиться'}
          </button>

          <button className="btn-primary px-2" onClick={openCompiler}>
            <Setting width="1.5rem" height="1.5rem" />
          </button>
        </div>

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
      <ServerSelectModal isOpen={isCompilerOpen} onClose={closeCompiler} />
    </section>
  );
};
