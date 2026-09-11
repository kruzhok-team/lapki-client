import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { CodeEditor } from '@renderer/components/CodeEditor';
import { Compiler } from '@renderer/components/Modules/Compiler';
import { Checkbox, ScrollArea } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { CompileCommandResult } from '@renderer/types/CompilerTypes';
import { Elements, StateMachine } from '@renderer/types/diagram';
import { Language } from '@renderer/types/tabs';
import { getDefaultSmSelection, languageMappers } from '@renderer/utils';

import { CompilerStatus } from '../Modules/Websocket/ClientStatus';

interface SourceCodeTab {
  id: string;
  name: string;
  code: string;
  language: Language;
}

const COMPILATION_LOG_TAB_ID = 'compilation-log';

const getSourceLanguage = (extension: string): Language => {
  const language = languageMappers[extension] ?? extension;
  return ['cpp', 'xml', 'json', 'txt'].includes(language) ? (language as Language) : 'txt';
};

export const CompilerTab: React.FC = () => {
  const modelController = useModelContext();
  const { compilerData, compilerStatus, secondsUntilCompilerReconnect } = useManagerMS();
  const stateMachines = modelController.model.useData('', 'elements.stateMachinesId') as {
    [id: string]: StateMachine;
  };
  const bearlogaSmId = Object.keys(stateMachines).find((smId) =>
    stateMachines[smId].platform.startsWith('Bearloga')
  );
  const [smId, setSmId] = useState<string | undefined>(undefined);
  // секунд до переподключения, null - означает, что отчёт до переподключения не ведётся
  const [sourceTabs, setSourceTabs] = useState<SourceCodeTab[]>([]);
  const [activeContentTab, setActiveContentTab] = useState(COMPILATION_LOG_TAB_ID);

  const [selectedStateMachines, setSelectedStateMachines] = useState<{ [id: string]: boolean }>(
    getDefaultSmSelection(stateMachines, {})
  );
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
    const selectedElements: Elements = {
      stateMachines: {},
    };

    for (const smId in selectedStateMachines) {
      if (smId !== '' && selectedStateMachines[smId]) {
        selectedElements.stateMachines[smId] = stateMachines[smId];
      }
    }
    Compiler.filename = name;
    modelController.files.compile(selectedElements);
  };

  const handleReconnect = () => {
    Compiler.reconnect();
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

  const handleShowSource = () => {
    if (!compilerData) return;

    const selectedCompiledMachines = Object.entries(compilerData.state_machines).filter(
      ([id, stateMachine]) => id !== '' && selectedStateMachines[id] && stateMachine.source.length
    );
    const showMachineName = selectedCompiledMachines.length > 1;
    const tabs = selectedCompiledMachines.flatMap(([id, stateMachine]) =>
      stateMachine.source.map((element, index) => {
        const filename = `${element.filename}.${element.extension}`;
        const machineName = stateMachines[id]?.name ?? id;
        return {
          id: `${id}:${filename}:${index}`,
          name: showMachineName ? `${machineName}/${filename}` : filename,
          code: element.fileContent,
          language: getSourceLanguage(element.extension),
        };
      })
    );
    setSourceTabs(tabs);
    setActiveContentTab(tabs[0]?.id ?? COMPILATION_LOG_TAB_ID);
  };

  const handleStateMachineSelection = (id: string, checked: boolean) => {
    setSelectedStateMachines((selection) => ({ ...selection, [id]: checked }));
    if (checked) setSmId(id);
  };

  const handleSelectAll = (checked: boolean) => {
    const stateMachineIds = Object.keys(stateMachines).filter((id) => id !== '');
    const selection = Object.fromEntries(stateMachineIds.map((id) => [id, checked]));
    setSelectedStateMachines(selection);
    if (checked && !smId) setSmId(stateMachineIds[0]);
  };

  useEffect(() => {
    setSelectedStateMachines((selection) => getDefaultSmSelection(stateMachines, selection));
  }, [stateMachines]);

  useEffect(() => {
    if (!compilerData) return;
    if (smId && compilerData.state_machines[smId]) return;

    setSmId(Object.keys(compilerData.state_machines).find((id) => id !== ''));
  }, [compilerData, smId]);

  useEffect(() => {
    setSourceTabs([]);
    setActiveContentTab(COMPILATION_LOG_TAB_ID);
  }, [compilerData]);

  const buttons = [
    {
      name: 'Посмотреть код',
      handler: handleShowSource,
      disabled: !Object.entries(compilerData?.state_machines ?? {}).some(
        ([id, stateMachine]) =>
          id !== '' && selectedStateMachines[id] && stateMachine.source.length > 0
      ),
    },
    {
      name: 'Экспорт кода',
      handler: handleSaveSourceIntoFolder,
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
  ];
  const isDisconnected =
    compilerStatus === CompilerStatus.NO_CONNECTION ||
    compilerStatus === CompilerStatus.CONNECTION_ERROR;
  const isProcessing =
    compilerStatus === CompilerStatus.COMPILATION || compilerStatus === CompilerStatus.CONNECTING;
  const hasSelectedStateMachine = Object.values(selectedStateMachines).some(Boolean);
  const compileDisabled =
    compilerStatus !== CompilerStatus.CONNECTED || !isInitialized || !hasSelectedStateMachine;
  const primaryButtonDisabled = isProcessing || (!isDisconnected && compileDisabled);
  const showReconnectTime = () => {
    if (secondsUntilCompilerReconnect == null) return;
    return <p>До подключения: {secondsUntilCompilerReconnect} сек.</p>;
  };

  const stateMachineEntries = Object.entries(stateMachines).filter(([id]) => id !== '');
  const allSelected =
    stateMachineEntries.length > 0 &&
    stateMachineEntries.every(([id]) => selectedStateMachines[id]);
  const compilationLog = compilerData
    ? Object.entries(compilerData.state_machines)
        .map(
          ([id, sm]) =>
            `Машина состояний ${stateMachines[id]?.name ?? id}:\n${commandsResultToStr(
              sm.commands
            )}`
        )
        .join('----------\n\n')
        .trimEnd()
    : '';
  const compilationLogLines = compilationLog ? compilationLog.split('\n') : [];
  const activeSourceTab = sourceTabs.find(({ id }) => id === activeContentTab);

  return (
    <section className="flex gap-8">
      <div className="flex w-[222px] shrink-0 flex-col">
        <h2 className="h2-header mb-3">Машины состояний</h2>
        <ScrollArea className="mb-4 h-auto py-0" contentClassName="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              className="bg-bg-primary"
              checked={allSelected}
              onCheckedChange={(checked) => handleSelectAll(checked === true)}
            />
            <span>Все</span>
          </label>
          {stateMachineEntries.map(([id, stateMachine]) => (
            <label key={id} className="flex cursor-pointer items-center gap-3">
              <Checkbox
                className="bg-bg-primary"
                checked={selectedStateMachines[id] ?? false}
                onCheckedChange={(checked) => handleStateMachineSelection(id, checked === true)}
              />
              <span className="truncate" title={stateMachine.name ?? id}>
                {stateMachine.name ?? id}
              </span>
            </label>
          ))}
        </ScrollArea>

        <div className="mb-5 flex">
          <button
            type="button"
            disabled={primaryButtonDisabled}
            className="btn-primary px-3 py-2"
            onClick={isDisconnected ? handleReconnect : handleCompile}
          >
            {isDisconnected ? 'Переподключиться' : 'Скомпилировать'}
          </button>
        </div>

        <div className="flex flex-col items-start gap-4 pl-3 font-medium">
          {bearlogaSmId !== undefined ? (
            <button
              type="button"
              disabled={compileDisabled}
              className="text-left text-primary hover:underline disabled:cursor-not-allowed disabled:text-text-disabled disabled:no-underline"
              onClick={handleExportBearloga}
            >
              Экспорт в Берлогу
            </button>
          ) : undefined}

          {buttons.map(({ name, handler, disabled: buttonDisabled }) => (
            <button
              key={name}
              type="button"
              className="text-left text-primary hover:underline disabled:cursor-not-allowed disabled:text-text-disabled disabled:no-underline"
              onClick={handler}
              disabled={buttonDisabled}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="mt-auto">{showReconnectTime()}</div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col [contain:size]">
        <div className="mb-3 flex min-h-5 items-center gap-5 overflow-x-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb [&::-webkit-scrollbar]:!h-[2px]">
          {sourceTabs.length === 0 ? (
            <h2 className="h2-header">Журнал компиляции</h2>
          ) : (
            <>
              <button
                type="button"
                className={
                  activeContentTab === COMPILATION_LOG_TAB_ID
                    ? 'shrink-0 font-medium text-primary'
                    : 'shrink-0 hover:text-primary'
                }
                onClick={() => setActiveContentTab(COMPILATION_LOG_TAB_ID)}
              >
                Журнал компиляции
              </button>
              {sourceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={
                    activeContentTab === tab.id
                      ? 'shrink-0 font-medium text-primary'
                      : 'shrink-0 hover:text-primary'
                  }
                  onClick={() => setActiveContentTab(tab.id)}
                  title={tab.name}
                >
                  {tab.name}
                </button>
              ))}
            </>
          )}
        </div>
        <div
          className={twMerge(
            'h-0 min-h-0 flex-1 rounded-lg border border-border-primary bg-bg-primary font-Fira text-xs leading-4',
            activeSourceTab ? 'overflow-hidden' : 'overflow-auto'
          )}
        >
          {activeSourceTab ? (
            <CodeEditor
              key={activeSourceTab.id}
              initialValue={activeSourceTab.code}
              language={activeSourceTab.language}
            />
          ) : compilationLogLines.length > 0 ? (
            <div className="grid min-w-max select-text grid-cols-[auto_1fr] py-1">
              {compilationLogLines.map((line, index) => (
                <React.Fragment key={index}>
                  <span className="select-none border-r border-border-primary px-2 text-right text-text-inactive">
                    {index + 1}
                  </span>
                  <span className="whitespace-pre px-2">{line || ' '}</span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="p-3 text-text-inactive">Журнал пока пуст</div>
          )}
        </div>
      </div>
    </section>
  );
};
