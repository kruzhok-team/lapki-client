import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { useErrorModal, useFileOperations, useSettings } from '@renderer/hooks';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { SidebarIndex, useSidebar } from '@renderer/store/useSidebar';
import { useTabs } from '@renderer/store/useTabs';
import { CompileCommandResult, CompilerResult } from '@renderer/types/CompilerTypes';
import { Elements, StateMachine } from '@renderer/types/diagram';
import { languageMappers } from '@renderer/utils';

import { CompilerStatus, CompilerNoDataStatus } from '../Modules/Websocket/ClientStatus';
import { Select } from '../UI/Select/Select';

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
  const [compilerNoDataStatus, setCompilerNoDataStatus] = useState<string>(
    CompilerNoDataStatus.DEFAULT
  );
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
  const changeSidebarTab = useSidebar((state) => state.changeTab);

  const name = modelController.model.useData('', 'name');
  const editor = modelController.getCurrentCanvas();
  const isInitialized = modelController.model.useData('', 'canvas.isInitialized', editor.id);

  const handleFlashButton = () => {
    changeSidebarTab(SidebarIndex.Flasher);
  };

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
    if (!smId || !compilerData) return;
    openTab(modelController, {
      type: 'code',
      name: 'compilerLog',
      code: commandsResultToStr(compilerData.state_machines[smId].commands),
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

    Compiler.bindReact(
      setCompilerData,
      setCompilerStatus,
      setImportData,
      setCompilerNoDataStatus,
      setSecondsUntilReconnect
    );
    Compiler.connect(host, port);
  }, [compilerSetting]);
  const button = [
    {
      name: 'Показать журнал компиляции',
      handler: handleAddStdoutTab,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.commands === undefined ||
        compilerData?.state_machines[smId]?.commands.length === 0,
    },
    {
      name: 'Сохранить результат',
      handler: handleSaveBinaryIntoFolder,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.binary === undefined ||
        compilerData.state_machines[smId]?.binary.length === 0,
    },
    {
      name: 'Сохранить код',
      handler: handleSaveSourceIntoFolder,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.source == undefined ||
        compilerData?.state_machines[smId]?.source.length === 0,
    },
    {
      name: 'Показать код',
      handler: handleShowSource,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.source == undefined ||
        compilerData?.state_machines[smId]?.source.length === 0,
    },
    {
      name: 'Прошить...',
      handler: handleFlashButton,
      disabled:
        !smId ||
        compilerData?.state_machines[smId]?.binary === undefined ||
        compilerData?.state_machines[smId]?.binary.length === 0,
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
  const getSmOption = (id: string, sm: StateMachine) => {
    return { value: id, label: sm.name ?? id, hint: getPlatform(sm.platform)?.name ?? '' };
  };
  const stateMachinesOptions = () => {
    const options = [...Object.entries(stateMachines)]
      .map(([id, sm]) => {
        return getSmOption(id, sm);
      })
      .filter((item) => item.value);
    return options;
  };
  const getSelectMachineStateOption = () => {
    if (!smId) return null;
    const sm = stateMachines[smId];
    if (!sm) {
      setSmId(undefined);
      return null;
    }
    return getSmOption(smId, sm);
  };

  return (
    <section>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Компилятор
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
        <p>
          Статус:{' '}
          <span
            className={twMerge(
              'text-primary',
              compilerStatus === CompilerStatus.NO_CONNECTION && 'text-error'
            )}
          >
            {compilerStatus}
          </span>
        </p>
        {showReconnectTime()}
        <div className="mb-4 min-h-[350px] select-text overflow-y-auto break-words rounded bg-bg-primary p-2">
          Результат компиляции: {compilerData ? compilerData.result : compilerNoDataStatus}
        </div>
        <Select
          className="mb-2"
          isSearchable={false}
          placeholder="Выберите машину состояний..."
          options={stateMachinesOptions()}
          value={getSelectMachineStateOption()}
          onChange={(opt) => setSmId(opt?.value)}
          noOptionsMessage={() => 'Машины состояний отсутствуют'}
        />
        {button.map(({ name, handler, disabled }, i) => (
          <button key={i} className="btn-primary mb-2" onClick={handler} disabled={disabled}>
            {name}
          </button>
        ))}
      </div>
    </section>
  );
};
