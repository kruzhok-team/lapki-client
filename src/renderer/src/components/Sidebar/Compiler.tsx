import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ConnectionStatus } from '@renderer/assets/icons/circle.svg';
import { ReactComponent as OkIcon } from '@renderer/assets/icons/mark-check.svg';
import { ReactComponent as NotOkIcon } from '@renderer/assets/icons/mark-cross.svg';
import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { useErrorModal, useFileOperations, useSettings } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { CompileCommandResult, CompilerResult } from '@renderer/types/CompilerTypes';
import { Elements, StateMachine } from '@renderer/types/diagram';
import { languageMappers } from '@renderer/utils';

import { CompilerStatus } from '../Modules/Websocket/ClientStatus';

export interface CompilerProps {
  openData: [boolean, string | null, string | null, string] | undefined;
  compilerData: CompilerResult | undefined;
  setCompilerData: React.Dispatch<React.SetStateAction<CompilerResult | undefined>>;
  compilerStatus: string;
  setCompilerStatus: React.Dispatch<React.SetStateAction<string>>;
  openImportError: (error: string) => void;
  openCompilerSettings: () => void;
}

export const CompilerTab: React.FC<CompilerProps> = ({
  openData,
  openCompilerSettings,
  compilerData,
  setCompilerData,
  compilerStatus,
  setCompilerStatus,
}) => {
  const modelController = useModelContext();
  const { openLoadError, openSaveError, openImportError } = useErrorModal();
  const { initImportData } = useFileOperations({
    openLoadError,
    openSaveError,
    openCreateSchemeModal: () => undefined,
    openImportError,
  });

  const [compilerSetting] = useSettings('compiler');
  const [importData, setImportData] = useState<Elements | undefined>(undefined);
  const stateMachines = modelController.model.useData('', 'elements.stateMachinesId') as {
    [id: string]: StateMachine;
  };
  const bearlogaSmId = Object.keys(stateMachines).find((smId) =>
    stateMachines[smId].platform.startsWith('Bearloga')
  );
  const [smId, setSmId] = useState<string | undefined>(undefined);
  // секунд до переподключения, null - означает, что отчёт до переподключения не ведётся
  const [secondsUntilReconnect, setSecondsUntilReconnect] = useState<number | null>(null);
  const openTab = useTabs((state) => state.openTab);

  const name = modelController.model.useData('', 'name');
  const isInitialized = modelController.model.useData('', 'isInitialized');

  const handleSaveBinaryIntoFolder = async () => {
    if (!smId) return;
    const sm = compilerData?.state_machines[smId];
    if (!sm) return;
    const preparedData = await Compiler.prepareToSave(sm.binary);
    modelController.files.saveIntoFolder(preparedData);
  };

  const handleExportBearloga = async () => {
    if (!name || !bearlogaSmId) return;
    Compiler.filename = name;
    Compiler.compile(
      stateMachines[bearlogaSmId],
      'BearlogaExport',
      stateMachines[bearlogaSmId].platform.split('-')[1],
      bearlogaSmId
    );
  };

  const handleCompile = async () => {
    if (!name) return;

    Compiler.filename = name;
    modelController.files.compile();
  };

  const handleSaveSourceIntoFolder = async () => {
    if (!smId || !compilerData) return;
    await modelController.files.saveIntoFolder(compilerData.state_machines[smId].source);
  };

  const commandsResultToStr = (compilerCommands: CompileCommandResult[]): string => {
    let stdout = '';
    compilerCommands.forEach((element) => {
      stdout += `${element.command}\nreturn_code: ${element.return_code}\nstdout: ${element.stdout}\n stderr: ${element.stderr}\n\n`;
    });

    return stdout;
  };

  const handleAddStdoutTab = () => {
    if (!compilerData) return;
    const commands = Object.entries(compilerData.state_machines)
      .map(([id, sm]) => {
        return (
          `Машина состояний ${stateMachines[id].name ?? id}:\n` + commandsResultToStr(sm.commands)
        );
      })
      .join('----------\n\n');
    openTab(modelController, {
      type: 'code',
      name: 'compilerLog',
      code: commands,
      language: 'txt',
    });
  };

  const handleShowSource = () => {
    if (!smId) return;
    const sm = compilerData?.state_machines[smId];
    if (!sm) return;
    sm.source.forEach((element) => {
      openTab(modelController, {
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
      initImportData(importData, openData);
      setImportData(undefined);
    }
  }, [importData]);

  useEffect(() => {
    if (!compilerSetting) return;

    const { host, port } = compilerSetting;

    Compiler.bindReact(setCompilerData, setCompilerStatus, setImportData, setSecondsUntilReconnect);
    Compiler.connect(host, port);
  }, [compilerSetting]);

  const button = [
    {
      name: 'Посмотреть код',
      handler: handleShowSource,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.source === undefined ||
        compilerData?.state_machines[smId]?.source.length === 0,
    },
    {
      name: 'Экспорт прошивки',
      handler: handleSaveBinaryIntoFolder,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.binary === undefined ||
        compilerData.state_machines[smId]?.binary.length === 0,
    },
    {
      name: 'Экспорт кода',
      handler: handleSaveSourceIntoFolder,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.source === undefined ||
        compilerData?.state_machines[smId]?.source.length === 0,
    },
  ];
  const processing =
    compilerStatus == CompilerStatus.COMPILATION || compilerStatus == CompilerStatus.CONNECTING;
  const canCompile = compilerStatus == CompilerStatus.CONNECTED && isInitialized;
  const disabled =
    processing || (!processing && !canCompile && compilerStatus !== CompilerStatus.NO_CONNECTION);
  const showReconnectTime = () => {
    if (secondsUntilReconnect == null) return;
    return <p>До подключения: {secondsUntilReconnect} сек.</p>;
  };

  return (
    <section>
      <h3 className="mx-4 mb-3 flex flex-row items-center border-b border-border-primary py-2 text-center text-lg">
        <div className="w-full">Компилятор</div>
        <div className="relative right-5">
          <ConnectionStatus
            className={twMerge(
              compilerStatus === CompilerStatus.NO_CONNECTION && 'fill-error',
              compilerStatus === CompilerStatus.CONNECTED && 'fill-success'
            )}
            width="10px"
            height="10px"
          />
        </div>
      </h3>
      <div className="flex flex-col px-4">
        <div className="mb-2 flex rounded">
          <button
            disabled={disabled}
            className="btn-primary mr-2 flex w-full items-center justify-center gap-2 px-0"
            onClick={canCompile ? handleCompile : handleReconnect}
          >
            {compilerStatus !== CompilerStatus.NO_CONNECTION
              ? 'Скомпилировать'
              : 'Переподключиться'}
          </button>
          <button className="btn-primary px-2" onClick={openCompilerSettings}>
            <Setting width="1.5rem" height="1.5rem" />
          </button>
        </div>

        {bearlogaSmId !== undefined ? (
          <div className="mb-2 flex rounded">
            <button
              disabled={disabled}
              className="btn-primary mr-2 flex w-full items-center justify-center gap-2 px-0"
              onClick={handleExportBearloga}
            >
              Экспорт в Берлогу
            </button>
          </div>
        ) : undefined}
        <p className="my-1">
          Статус:{' '}
          <span
            className={twMerge('text-primary', compilerData?.result === 'NOTOK' && 'text-error')}
          >
            {compilerData?.result ?? 'Нет данных'}
          </span>
        </p>
        {showReconnectTime()}
        <button className="btn-primary" onClick={handleAddStdoutTab} disabled={!compilerData}>
          Журнал компиляции
        </button>
        <div className="mb-1 mt-20"> Машины состояний: </div>
        <div className="mb-4 flex h-[200px] select-text flex-col overflow-y-auto break-words rounded bg-bg-primary scrollbar-thin">
          {compilerData?.state_machines ? (
            Object.entries(compilerData.state_machines).map(([id, sm]) => (
              <div
                onClick={() => setSmId(id)}
                className={twMerge(
                  'cursor-pointer hover:bg-bg-hover',
                  smId === id && 'bg-bg-hover'
                )}
              >
                <div className="flex h-auto w-auto items-center p-2">
                  {sm.result === 'OK' ? (
                    <OkIcon className="size-5 fill-current" />
                  ) : (
                    <NotOkIcon className="size-5 fill-error" />
                  )}
                  <span className="ml-2 flex">{stateMachines[id].name ?? id}</span>
                </div>
                <hr className="h-[1px] w-auto border-bg-hover opacity-70" />
              </div>
            ))
          ) : (
            <div className="p-2">Нет скомпилированных МС...</div>
          )}
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
