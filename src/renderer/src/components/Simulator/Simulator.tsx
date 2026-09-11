import React, { useEffect, useLayoutEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ParameterSelect } from '@renderer/components/UI';
import { exportStateMachineCGML } from '@renderer/lib/data/GraphmlBuilder';
import { useModelContext } from '@renderer/store/ModelContext';
import { getActiveTask, useTasks } from '@renderer/store/useTasks';
import { StateMachine } from '@renderer/types/diagram';
import {
  GardenerParameters,
  ReaderParameters,
  SimulationResult,
} from '@renderer/types/InterpreterTypes';

import { ExecutionHistory } from './ExecutionHistory';
import { GardenerMarker, gardenerCellStyles } from './GardenerField';
import {
  GardenerCell,
  GardenerOrientation,
  MAX_FIELD_SIZE,
  MIN_FIELD_SIZE,
  clampPosition,
  createField,
  nextPlaybackIndex,
  resizeField,
  setFieldCell,
} from './model';
import { countUnicodeCharacters, limitUnicodeCharacters } from './readerModel';
import { ReaderResult } from './ReaderResult';
import {
  SimulationMachineOption,
  getSimulationMachineOptions,
  isSimulationResultStale,
  selectInitialMachineId,
} from './selection';
import { SimulationMode, SimulationRunPanel } from './SimulationRunPanel';
import { TaskMode } from './TaskMode';
import { taskForProtocol } from './taskProtocol';
import { useInterpreter } from './useInterpreter';

interface SimulatorProps {
  initialSmId?: string;
  onStatusChange?: (status: string) => void;
  onAutoSizeChange?: (autoSize: boolean) => void;
}

type GardenerTool = GardenerCell | 'position';
type SimulationParameters = GardenerParameters | ReaderParameters;

interface RuntimeProps {
  ready: boolean;
  active: boolean;
  result?: SimulationResult;
  error?: string;
  stale: boolean;
  onStart: (mode: SimulationMode, timeout: number, parameters: SimulationParameters) => void;
  onCancel: () => void;
}

interface GardenerRuntimeProps extends RuntimeProps {
  machineSelector: React.ReactNode;
}

type ReaderRuntimeProps = GardenerRuntimeProps;

const fieldTools: { value: GardenerTool; label: string; swatch: string }[] = [
  { value: 'position', label: 'Старт', swatch: 'bg-[#ffd600]' },
  { value: 0, label: 'Пусто', swatch: 'border border-border-primary bg-white' },
  { value: -1, label: 'Стена', swatch: 'bg-[#333333]' },
  { value: 1, label: 'Роза', swatch: 'bg-[#e87373]' },
  { value: 2, label: 'Мята', swatch: 'bg-[#78ed9d]' },
  { value: 3, label: 'Василёк', swatch: 'bg-[#65ced8]' },
];

const cellLabels: Record<GardenerCell, string> = {
  [-1]: 'стена',
  0: 'пустая клетка',
  1: 'роза',
  2: 'мята',
  3: 'василёк',
};

const orientationOptions: { value: GardenerOrientation; label: string }[] = [
  { value: 'north', label: 'Север' },
  { value: 'east', label: 'Восток' },
  { value: 'south', label: 'Юг' },
  { value: 'west', label: 'Запад' },
];

const controlClassName =
  'h-8 w-full rounded-lg border border-border-primary bg-bg-primary px-3 text-xs text-text-primary outline-none focus:border-text-inactive';

const gardenerNumericControlClassName =
  'h-8 w-full rounded-lg border border-border-primary bg-bg-primary px-3 text-xs text-text-primary outline-none focus:border-text-inactive';

const PLAYBACK_INTERVAL_MS = 500;

const FieldInput: React.FC<React.PropsWithChildren<{ label: string; htmlFor: string }>> = ({
  label,
  htmlFor,
  children,
}) => (
  <label className="grid gap-2 text-xs" htmlFor={htmlFor}>
    <span className="text-text-primary">{label}</span>
    {children}
  </label>
);

const MachineSelector: React.FC<{
  options: SimulationMachineOption[];
  selectedSmId?: string;
  active: boolean;
  onSelect: (smId: string) => void;
}> = ({ options, selectedSmId, active, onSelect }) => (
  <div className="min-w-0">
    <label className="grid gap-2 text-xs" htmlFor="simulator-state-machine">
      <span className="h2-header font-medium">Машина состояний</span>
      <ParameterSelect
        inputId="simulator-state-machine"
        className="w-full"
        isSearchable={false}
        isClearable={false}
        isDisabled={active || options.length === 0}
        placeholder={options.length === 0 ? 'Нет поддерживаемых машин' : 'Выберите машину'}
        noOptionsMessage={() => 'Нет поддерживаемых машин'}
        options={options.map(({ id, machine: optionMachine }) => ({
          value: id,
          label: optionMachine.name || id,
        }))}
        value={options
          .map(({ id, machine: optionMachine }) => ({ value: id, label: optionMachine.name || id }))
          .find((option) => option.value === selectedSmId)}
        onChange={(option) => {
          if (option) onSelect(option.value);
        }}
      />
    </label>
  </div>
);

const GardenerSimulator: React.FC<GardenerRuntimeProps> = ({
  machineSelector,
  ready,
  active,
  result,
  error,
  stale,
  onStart,
  onCancel,
}) => {
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(8);
  const [field, setField] = useState(() => createField(width, height));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [orientation, setOrientation] = useState<GardenerOrientation>('east');
  const [selectedTool, setSelectedTool] = useState<GardenerTool>(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const [mode, setMode] = useState<SimulationMode>('finite');
  const [timeout, setTimeoutValue] = useState(10);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [reviewingHistory, setReviewingHistory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const resultSteps = result?.steps;
  const steps = resultSteps ?? [];
  const historyStep = reviewingHistory ? steps[historyIndex] : undefined;
  const displayedField = historyStep?.field ?? field;
  const displayedPosition = historyStep?.position ?? position;
  const displayedOrientation = historyStep?.orientation ?? orientation;

  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
      setIsRightMouseDown(false);
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (reviewingHistory) return;

      if (event.button === 0) {
        setIsMouseDown(true);
      } else if (event.button === 2) {
        setIsRightMouseDown(true);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [reviewingHistory]);

  useLayoutEffect(() => {
    setHistoryIndex(Math.max(0, steps.length - 1));
    setReviewingHistory(steps.length > 0);
    setIsPlaying(false);
  }, [resultSteps, steps.length]);

  useEffect(() => {
    if (!isPlaying) return;
    if (historyIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setHistoryIndex((current) => nextPlaybackIndex(current, steps.length));
    }, PLAYBACK_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [historyIndex, isPlaying, steps.length]);

  const selectHistoryStep = (index: number) => {
    setIsPlaying(false);
    setReviewingHistory(true);
    setHistoryIndex(index);
  };

  const togglePlayback = () => {
    if (steps.length === 0) return;
    setReviewingHistory(true);
    if (!isPlaying && historyIndex === steps.length - 1) setHistoryIndex(0);
    setIsPlaying((current) => !current);
  };

  const stopHistoryPlayback = () => {
    setIsPlaying(false);
    setReviewingHistory(false);
  };

  const updateWidth = (value: number) => {
    const nextWidth = Math.max(MIN_FIELD_SIZE, Math.min(MAX_FIELD_SIZE, value));
    stopHistoryPlayback();
    setWidth(nextWidth);
    setField((current) => resizeField(current, nextWidth, height));
    setPosition((current) => clampPosition(current, nextWidth, height));
  };

  const updateHeight = (value: number) => {
    const nextHeight = Math.max(MIN_FIELD_SIZE, Math.min(MAX_FIELD_SIZE, value));
    stopHistoryPlayback();
    setHeight(nextHeight);
    setField((current) => resizeField(current, width, nextHeight));
    setPosition((current) => clampPosition(current, width, nextHeight));
  };

  const applySelectedTool = (x: number, y: number) => {
    if (selectedTool === 'position') {
      if (field[y][x] !== -1) {
        stopHistoryPlayback();
        setPosition({ x, y });
      }
      return;
    }
    if (position.x === x && position.y === y && selectedTool === -1) return;
    stopHistoryPlayback();
    setField((current) => setFieldCell(current, x, y, selectedTool));
  };

  const eraseCell = (x: number, y: number) => {
    stopHistoryPlayback();
    setField((current) => setFieldCell(current, x, y, 0));
  };

  const handleCellMouseDown = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (event.button === 0) {
      applySelectedTool(x, y);
    } else if (event.button === 2) {
      eraseCell(x, y);
    }
  };

  const handleCellMouseEnter = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (isRightMouseDown) {
      eraseCell(x, y);
    } else if (isMouseDown) {
      applySelectedTool(x, y);
    }
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[205px_minmax(398px,1fr)_228px] gap-x-6 gap-y-5 overflow-auto text-sm max-[983px]:grid-cols-[205px_minmax(398px,1fr)] max-[729px]:grid-cols-1">
      <div className="min-w-0">
        <SimulationRunPanel
          machineSelector={machineSelector}
          mode={mode}
          timeout={timeout}
          ready={ready}
          active={active}
          error={error}
          message={result?.message}
          stale={stale}
          reserveFeedbackSpace
          onModeChange={(nextMode) => {
            stopHistoryPlayback();
            setMode(nextMode);
          }}
          onTimeoutChange={(nextTimeout) => {
            stopHistoryPlayback();
            setTimeoutValue(nextTimeout);
          }}
          onStart={() =>
            onStart(mode, timeout, {
              width,
              height,
              field,
              position,
              orientation: orientation.toUpperCase() as Uppercase<GardenerOrientation>,
            })
          }
          onCancel={onCancel}
        />

        <ExecutionHistory
          steps={steps}
          historyIndex={historyIndex}
          isPlaying={isPlaying}
          isTruncated={result?.warnings?.includes('EXECUTION_HISTORY_TRUNCATED') ?? false}
          onSelectStep={selectHistoryStep}
          onTogglePlayback={togglePlayback}
        />
      </div>

      <section className="min-w-0">
        <h2 className="h2-header mb-2">Поле</h2>
        <div className="overflow-auto rounded-lg bg-bg-secondary p-3">
          <div
            className="grid w-max gap-1.5"
            style={{ gridTemplateColumns: `repeat(${width}, 2rem)` }}
          >
            {displayedField.flatMap((row, y) =>
              row.map((cell, x) => {
                const hasGardener = displayedPosition.x === x && displayedPosition.y === y;
                return (
                  <button
                    key={`${x}:${y}`}
                    type="button"
                    title={`${x}, ${y}: ${cellLabels[cell]}`}
                    aria-label={`Клетка ${x}, ${y}: ${cellLabels[cell]}`}
                    className={twMerge(
                      'relative size-8 rounded-lg',
                      gardenerCellStyles[cell],
                      reviewingHistory && 'cursor-default'
                    )}
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                    onMouseDown={(event) => handleCellMouseDown(event, x, y)}
                    onMouseEnter={(event) => handleCellMouseEnter(event, x, y)}
                  >
                    {hasGardener && (
                      <GardenerMarker
                        aria-label="Стартовая позиция Садовника"
                        orientation={displayedOrientation}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <p className="mt-6 max-w-[398px] text-xs leading-4 text-text-inactive">
          {reviewingHistory
            ? `Просмотр шага ${historyIndex + 1} из ${steps.length}.`
            : 'Выберите инструмент и нажмите на клетку. Кнопка “Старт” переносит начальную позицию.'}
        </p>
      </section>

      <div className="min-w-0 max-[983px]:col-span-2 max-[729px]:col-span-1">
        <section>
          <h2 className="h2-header mb-2">Настройки поля</h2>
          <div className="rounded-lg border border-border-primary p-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Ширина" htmlFor="simulator-field-width">
                <input
                  id="simulator-field-width"
                  className={gardenerNumericControlClassName}
                  type="number"
                  min={MIN_FIELD_SIZE}
                  max={MAX_FIELD_SIZE}
                  value={width}
                  onChange={(event) => updateWidth(Number(event.target.value))}
                />
              </FieldInput>
              <FieldInput label="Высота" htmlFor="simulator-field-height">
                <input
                  id="simulator-field-height"
                  className={gardenerNumericControlClassName}
                  type="number"
                  min={MIN_FIELD_SIZE}
                  max={MAX_FIELD_SIZE}
                  value={height}
                  onChange={(event) => updateHeight(Number(event.target.value))}
                />
              </FieldInput>
              <FieldInput label="Старт X" htmlFor="simulator-position-x">
                <input
                  id="simulator-position-x"
                  className={gardenerNumericControlClassName}
                  type="number"
                  min={0}
                  max={width - 1}
                  value={position.x}
                  onChange={(event) => {
                    stopHistoryPlayback();
                    setPosition((current) =>
                      clampPosition({ ...current, x: Number(event.target.value) }, width, height)
                    );
                  }}
                />
              </FieldInput>
              <FieldInput label="Старт Y" htmlFor="simulator-position-y">
                <input
                  id="simulator-position-y"
                  className={gardenerNumericControlClassName}
                  type="number"
                  min={0}
                  max={height - 1}
                  value={position.y}
                  onChange={(event) => {
                    stopHistoryPlayback();
                    setPosition((current) =>
                      clampPosition({ ...current, y: Number(event.target.value) }, width, height)
                    );
                  }}
                />
              </FieldInput>
            </div>
            <div className="mt-3">
              <FieldInput label="Направление" htmlFor="simulator-orientation">
                <ParameterSelect
                  inputId="simulator-orientation"
                  className="w-full"
                  isSearchable={false}
                  isClearable={false}
                  options={orientationOptions}
                  value={orientationOptions.find((option) => option.value === orientation)}
                  onChange={(option) => {
                    if (!option) return;
                    stopHistoryPlayback();
                    setOrientation(option.value);
                  }}
                />
              </FieldInput>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="h2-header mb-2">Инструменты</h2>
          <div className="rounded-lg border border-border-primary p-3">
            <div className="grid grid-cols-2 gap-2">
              {fieldTools.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  className={twMerge(
                    'flex h-8 items-center gap-2 rounded-lg border border-border-primary px-3 text-left text-xs transition-colors hover:bg-bg-hover',
                    selectedTool === tool.value && 'bg-bg-active'
                  )}
                  onClick={() => {
                    stopHistoryPlayback();
                    setSelectedTool(tool.value);
                  }}
                >
                  {tool.value === 'position' ? (
                    <span className="text-base leading-none text-[#ffd600]">▼</span>
                  ) : (
                    <span className={twMerge('size-4 shrink-0 rounded-full', tool.swatch)} />
                  )}
                  {tool.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 h-8 w-full rounded-lg border border-border-primary px-3 text-xs transition-colors hover:bg-bg-hover"
              onClick={() => {
                stopHistoryPlayback();
                setField(createField(width, height));
              }}
            >
              Очистить поле
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const ReaderSimulator: React.FC<ReaderRuntimeProps> = ({
  machineSelector,
  ready,
  active,
  result,
  error,
  stale,
  onStart,
  onCancel,
}) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<SimulationMode>('finite');
  const [timeout, setTimeoutValue] = useState(10);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[205px_250px_170px] justify-start gap-x-6 gap-y-5 overflow-hidden text-sm max-[983px]:content-start max-[983px]:overflow-auto max-[729px]:grid-cols-1">
      <SimulationRunPanel
        machineSelector={machineSelector}
        mode={mode}
        timeout={timeout}
        ready={ready}
        active={active}
        error={error}
        onModeChange={setMode}
        onTimeoutChange={setTimeoutValue}
        onStart={() => onStart(mode, timeout, { message })}
        onCancel={onCancel}
      />

      <section className="flex min-h-0 min-w-0 flex-col">
        <h2 className="h2-header mb-2">Импульсы</h2>
        <ReaderResult result={result} stale={stale} active={active} />
      </section>

      <section className="min-w-0 max-[983px]:col-span-2 max-[729px]:col-span-1">
        <h2 className="h2-header mb-2">Входная строка</h2>
        <div className="rounded-lg border border-border-primary p-3">
          <textarea
            aria-label="Входная строка"
            className={twMerge(
              controlClassName,
              'h-32 min-h-32 max-w-none resize-y py-2 font-Fira-Mono leading-4'
            )}
            value={message}
            placeholder="Введите строку"
            onChange={(event) => setMessage(limitUnicodeCharacters(event.target.value, 10_000))}
          />
          <div className="mt-2 flex justify-end text-xs text-text-inactive">
            <span>{countUnicodeCharacters(message)} / 10 000</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Simulator: React.FC<SimulatorProps> = ({
  initialSmId,
  onStatusChange,
  onAutoSizeChange,
}) => {
  const modelController = useModelContext();
  const interpreter = useInterpreter();
  const [activeTask, solutionMachineId, selectSolution] = useTasks((state) => [
    getActiveTask(state),
    state.solutionMachineId,
    state.selectSolution,
  ]);
  const stateMachines = modelController.model.useData('', 'elements.stateMachinesId') as {
    [id: string]: StateMachine;
  };
  const allOptions = getSimulationMachineOptions(stateMachines);
  const options = activeTask
    ? allOptions.filter(
        ({ machine: optionMachine }) => optionMachine.platform === activeTask.platformId
      )
    : allOptions;
  const optionIds = JSON.stringify(options.map(({ id }) => id));
  const [selectedSmId, setSelectedSmId] = useState(() =>
    selectInitialMachineId(options, solutionMachineId ?? initialSmId)
  );
  const [lastRunXml, setLastRunXml] = useState<string>();
  const subscriptionSmId = selectedSmId ?? '';
  modelController.model.useData(subscriptionSmId, 'elements.states');
  modelController.model.useData(subscriptionSmId, 'elements.transitions');
  modelController.model.useData(subscriptionSmId, 'elements.components');
  modelController.model.useData(subscriptionSmId, 'elements.initialStates');
  modelController.model.useData(subscriptionSmId, 'elements.finalStates');
  modelController.model.useData(subscriptionSmId, 'elements.choiceStates');
  modelController.model.useData(subscriptionSmId, 'elements.shallowHistory');
  modelController.model.useData(subscriptionSmId, 'elements.name');
  const machine = selectedSmId ? stateMachines[selectedSmId] : undefined;
  const currentXml =
    machine && selectedSmId
      ? exportStateMachineCGML(modelController.model.data.elements, selectedSmId)
      : undefined;
  const resultStale = isSimulationResultStale(
    interpreter.result !== undefined,
    lastRunXml,
    currentXml
  );

  useEffect(() => {
    onStatusChange?.(interpreter.status);
  }, [interpreter.status, onStatusChange]);

  useEffect(() => {
    onAutoSizeChange?.(
      activeTask?.platformId === 'junior-gardener' ||
        (!activeTask &&
          (machine?.platform === 'junior-reader' || machine?.platform === 'junior-gardener'))
    );
  }, [activeTask, machine?.platform, onAutoSizeChange]);

  useEffect(() => {
    if (!activeTask) return;
    selectSolution(selectedSmId, currentXml);
  }, [activeTask, currentXml, selectSolution, selectedSmId]);

  useEffect(() => {
    if (!initialSmId || interpreter.active) return;
    if (options.some(({ id }) => id === initialSmId)) {
      setSelectedSmId(initialSmId);
      setLastRunXml(undefined);
      interpreter.clear();
    }
    // initialSmId changes only when the Simulator workspace is opened for another machine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSmId]);

  useEffect(() => {
    if (interpreter.active || options.some(({ id }) => id === selectedSmId)) return;
    setSelectedSmId(selectInitialMachineId(options));
    setLastRunXml(undefined);
    interpreter.clear();
    // optionIds represents the supported subset; options itself is rebuilt on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interpreter.active, interpreter.clear, optionIds, selectedSmId]);

  const selectMachine = (smId: string) => {
    if (interpreter.active || smId === selectedSmId) return;
    setSelectedSmId(smId);
    setLastRunXml(undefined);
    interpreter.clear();
    if (activeTask) {
      const xml = exportStateMachineCGML(modelController.model.data.elements, smId);
      selectSolution(smId, xml);
    }
  };

  const start = (mode: SimulationMode, timeout: number, parameters: SimulationParameters) => {
    if (!selectedSmId || !currentXml) return;
    setLastRunXml(currentXml);
    interpreter.start({
      xml: currentXml,
      machineId: selectedSmId,
      mode,
      ...(mode === 'finite' ? { timeoutSeconds: timeout } : {}),
      parameters,
    });
  };

  const runTaskTest = (testId: string) => {
    if (!activeTask || !selectedSmId || !currentXml) return;
    interpreter.startTest({
      xml: currentXml,
      machineId: selectedSmId,
      task: taskForProtocol(activeTask),
      testId,
    });
  };

  const submitTask = () => {
    if (!activeTask || !selectedSmId || !currentXml) return;
    interpreter.startSubmission({
      xml: currentXml,
      machineId: selectedSmId,
      task: taskForProtocol(activeTask),
    });
  };

  return (
    <div
      className={twMerge(
        'flex h-full min-h-0 flex-col bg-bg-primary text-text-primary',
        !onStatusChange && 'p-4'
      )}
    >
      {!onStatusChange && (
        <div className="mb-6 flex items-center gap-11 border-b border-border-primary pb-3 text-sm font-medium">
          <span>Симулятор</span>
          <span className="font-normal">
            <span className="font-medium">Статус: </span>
            <span className="text-primary">{interpreter.status}</span>
          </span>
        </div>
      )}
      {(activeTask ||
        (machine?.platform !== 'junior-gardener' && machine?.platform !== 'junior-reader')) && (
        <div className="mb-4 w-64 max-w-full">
          <MachineSelector
            options={options}
            selectedSmId={selectedSmId}
            active={interpreter.active}
            onSelect={selectMachine}
          />
        </div>
      )}
      {activeTask && (
        <TaskMode
          task={activeTask}
          ready={interpreter.ready}
          active={interpreter.active}
          operationKind={interpreter.operationKind}
          error={interpreter.error}
          hasSolution={machine !== undefined}
          onRunTest={runTaskTest}
          onCancel={interpreter.cancel}
          onSubmit={submitTask}
        />
      )}
      {!activeTask && machine?.platform === 'junior-gardener' && (
        <GardenerSimulator
          {...interpreter}
          machineSelector={
            <MachineSelector
              options={options}
              selectedSmId={selectedSmId}
              active={interpreter.active}
              onSelect={selectMachine}
            />
          }
          stale={resultStale}
          onStart={start}
          onCancel={interpreter.cancel}
        />
      )}
      {!activeTask && machine?.platform === 'junior-reader' && (
        <ReaderSimulator
          {...interpreter}
          machineSelector={
            <MachineSelector
              options={options}
              selectedSmId={selectedSmId}
              active={interpreter.active}
              onSelect={selectMachine}
            />
          }
          stale={resultStale}
          onStart={start}
          onCancel={interpreter.cancel}
        />
      )}
    </div>
  );
};
