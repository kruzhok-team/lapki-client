import React, { useEffect, useMemo, useState } from 'react';

import { GardenerMarker, type GardenerFieldOrientation, gardenerCellStyles } from './GardenerField';
import { ReaderImpulseList } from './ReaderResult';

import type {
  CatalogTask,
  GardenerTaskInput,
  ReaderTaskInput,
  VerificationTest,
} from '../../../../common/tasks';
import { type TaskTestPhase, useTasks } from '../../store/useTasks';
import type { SimulationResult } from '../../types/InterpreterTypes';

const phaseLabels = {
  idle: 'Не запускался',
  waiting: 'Ожидает',
  running: 'Выполняется',
  passed: 'Пройден',
  failed: 'Не пройден',
};

const reasonLabels = {
  CHECK_FAILED: 'Результат не соответствует условию',
  TIMEOUT: 'Превышено время выполнения',
  GARDENER_CRASH: 'Садовник столкнулся с препятствием',
  EXECUTION_ERROR: 'Ошибка выполнения',
};

const checkLabels = {
  'gardener.field.equals': 'Итоговое поле не совпадает',
  'gardener.position.equals': 'Итоговая позиция не совпадает',
  'reader.impulses.equals': 'Последовательность выходных импульсов не совпадает',
};

const phaseStyles: Record<TaskTestPhase, { dot: string; label: string; text: string }> = {
  idle: {
    dot: 'border border-border-primary bg-bg-primary',
    label: phaseLabels.idle,
    text: 'text-text-inactive',
  },
  waiting: {
    dot: 'bg-warning',
    label: phaseLabels.waiting,
    text: 'text-warning',
  },
  running: {
    dot: 'animate-pulse bg-primary',
    label: phaseLabels.running,
    text: 'text-primary',
  },
  passed: {
    dot: 'bg-emerald-500',
    label: phaseLabels.passed,
    text: 'text-emerald-600',
  },
  failed: {
    dot: 'bg-error',
    label: phaseLabels.failed,
    text: 'text-error',
  },
};

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 16 16" fill="none">
    <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.75v4M8 11.25h.01" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const FieldView: React.FC<{
  input: GardenerTaskInput;
  field?: GardenerTaskInput['field'];
  position?: GardenerTaskInput['position'];
  orientation?: GardenerFieldOrientation;
}> = ({
  input,
  field = input.field,
  position = input.position,
  orientation = input.orientation,
}) => (
  <div className="overflow-auto rounded-lg bg-bg-secondary p-3">
    <div
      className="grid w-max gap-1.5"
      style={{ gridTemplateColumns: `repeat(${input.width}, 2rem)` }}
    >
      {field.flatMap((row, y) =>
        row.map((cell, x) => {
          const hasGardener = position.x === x && position.y === y;
          return (
            <div
              key={`${x}-${y}`}
              className={`relative size-8 rounded-lg ${gardenerCellStyles[cell]}`}
              title={`(${x}, ${y})`}
            >
              {hasGardener && <GardenerMarker orientation={orientation} />}
            </div>
          );
        })
      )}
    </div>
  </div>
);

const GardenerDetails: React.FC<{
  test: VerificationTest;
  execution?: SimulationResult;
}> = ({ test, execution }) => {
  const input = test.input as GardenerTaskInput;
  const steps = execution?.steps ?? [];
  const [stepIndex, setStepIndex] = useState(Math.max(steps.length - 1, 0));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setStepIndex(Math.max(steps.length - 1, 0));
    setPlaying(false);
  }, [execution, steps.length]);

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setInterval(() => {
      setStepIndex((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  const step = steps[stepIndex];
  const environment = execution?.result?.environment;
  const visible = step ?? environment;

  const emptyField = input.field.map((row) => row.map(() => 0 as const));

  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 content-start items-start gap-4 overflow-y-auto bg-bg-primary p-4">
      <section className="min-w-0 rounded-xl border border-border-primary bg-bg-primary p-4 shadow-sm">
        <div className="mb-4 flex h-4 items-center">
          <h3 className="h2-header">Входное поле</h3>
        </div>
        <div className="flex justify-center">
          <FieldView input={input} />
        </div>
      </section>

      <section className="min-w-0 rounded-xl border border-border-primary bg-bg-primary p-4 shadow-sm">
        <div className="mb-4 flex h-4 items-center justify-between gap-3">
          <div>
            <h3 className="h2-header">Фактическое поле</h3>
          </div>
          <span className="shrink-0 rounded-full bg-bg-secondary px-1.5 text-[10px] leading-4 text-text-inactive">
            {steps.length > 0
              ? `${stepIndex + 1} / ${steps.length}`
              : execution
              ? 'Итог'
              : 'Нет запуска'}
          </span>
        </div>

        <div className="flex justify-center">
          {visible ? (
            <FieldView
              input={input}
              field={visible.field}
              position={visible.position}
              orientation={visible.orientation}
            />
          ) : (
            <div className="relative flex w-full justify-center">
              <div className="flex w-full justify-center opacity-25">
                <FieldView input={input} field={emptyField} position={{ x: -1, y: -1 }} />
              </div>
              <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-text-inactive">
                Запустите тест, чтобы увидеть результат
              </p>
            </div>
          )}
        </div>

        {steps.length > 0 && (
          <div className="mx-auto mt-4 w-full max-w-[320px] border-t border-border-primary pt-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <button
                type="button"
                className="h-8 rounded-lg px-3 text-xs transition-colors enabled:bg-primary enabled:text-text-secondary disabled:cursor-not-allowed disabled:bg-bg-active disabled:text-text-disabled"
                onClick={() => {
                  if (stepIndex >= steps.length - 1) setStepIndex(0);
                  setPlaying((current) => !current);
                }}
              >
                {playing ? 'Пауза' : 'Воспроизвести'}
              </button>
              <span className="whitespace-nowrap text-xs text-text-inactive">
                Шаг {stepIndex + 1} из {steps.length}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(steps.length - 1, 0)}
              value={stepIndex}
              aria-label="Шаг выполнения"
              onChange={(event) => {
                setPlaying(false);
                setStepIndex(Number(event.target.value));
              }}
              className="w-full accent-primary"
            />
          </div>
        )}
      </section>
    </div>
  );
};

const ReaderDetails: React.FC<{
  test: VerificationTest;
  execution?: SimulationResult;
}> = ({ test, execution }) => {
  const input = test.input as ReaderTaskInput;
  const impulses = execution?.result?.calledSignals ?? [];
  return (
    <div className="grid gap-4 overflow-y-auto bg-bg-primary p-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border-primary bg-bg-primary p-4 shadow-sm">
        <h3 className="h2-header mb-3">Входная строка</h3>
        <pre className="whitespace-pre-wrap rounded-lg border border-border-primary p-3 text-xs">
          {input.message}
        </pre>
      </section>
      <section className="rounded-xl border border-border-primary bg-bg-primary p-4 shadow-sm">
        <h3 className="h2-header mb-3">Выходные импульсы</h3>
        <ReaderImpulseList impulses={impulses} emptyMessage="Импульсы ещё не получены." />
      </section>
    </div>
  );
};

interface TaskModeProps {
  task: CatalogTask;
  ready: boolean;
  active: boolean;
  operationKind?: 'run' | 'test' | 'submission';
  error?: string;
  hasSolution: boolean;
  onRunTest: (testId: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const TaskMode: React.FC<TaskModeProps> = ({
  task,
  ready,
  active,
  operationKind,
  error,
  hasSolution,
  onRunTest,
  onCancel,
  onSubmit,
}) => {
  const [testStates, detailedResult, submissionResult] = useTasks((state) => [
    state.testStates,
    state.detailedResult,
    state.submissionResult,
  ]);
  const [selectedTestId, setSelectedTestId] = useState(task.tests[0]?.id);

  useEffect(() => setSelectedTestId(task.tests[0]?.id), [task.id, task.version, task.tests]);
  const selectedTest = task.tests.find((test) => test.id === selectedTestId) ?? task.tests[0];
  const selectedState = selectedTest ? testStates[selectedTest.id] : undefined;
  const detailedExecution =
    detailedResult?.testId === selectedTest?.id
      ? detailedResult.execution
      : selectedState?.source === 'submission'
      ? (selectedState.verdict?.outcome as SimulationResult | undefined)
      : undefined;

  const summary = useMemo(() => {
    if (!submissionResult) return undefined;
    return submissionResult.status === 'accepted'
      ? `Решение принято: ${submissionResult.passed} из ${submissionResult.total}`
      : `Решение не принято: ${submissionResult.passed} из ${submissionResult.total}`;
  }, [submissionResult]);
  const selectedPhase = selectedState?.phase ?? 'idle';
  const selectedPhaseStyle = phaseStyles[selectedPhase];
  const completedTests = task.tests.filter((test) => {
    const phase = testStates[test.id]?.phase;
    return phase === 'passed' || phase === 'failed';
  }).length;
  const passedTests = task.tests.filter((test) => testStates[test.id]?.phase === 'passed').length;
  const failedMessage = selectedState?.verdict?.reasonCode
    ? selectedState.verdict.failedCheckType
      ? checkLabels[selectedState.verdict.failedCheckType]
      : reasonLabels[selectedState.verdict.reasonCode]
    : undefined;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_304px] overflow-hidden rounded-lg border border-border-primary">
      <div className="flex min-h-0 flex-col">
        <div className="border-b border-border-primary px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-inactive">
                Тест {Math.max(task.tests.findIndex((test) => test.id === selectedTest?.id) + 1, 1)}{' '}
                из {task.tests.length}
              </p>
              <h2 className="h2-header mt-1 truncate">{selectedTest?.title}</h2>
            </div>
            <div
              className={`flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs ${selectedPhaseStyle.text}`}
            >
              <span className={`size-2 rounded-full ${selectedPhaseStyle.dot}`} />
              {selectedPhaseStyle.label}
            </div>
          </div>
          {failedMessage && (
            <div className="border-error/30 bg-error/5 mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-error">
              <AlertIcon className="size-4 shrink-0" />
              <p>{failedMessage}</p>
            </div>
          )}
        </div>
        {selectedTest && task.platformId === 'junior-gardener' && (
          <GardenerDetails test={selectedTest} execution={detailedExecution} />
        )}
        {selectedTest && task.platformId === 'junior-reader' && (
          <ReaderDetails test={selectedTest} execution={detailedExecution} />
        )}
      </div>

      <aside className="flex min-h-0 flex-col border-l border-border-primary bg-bg-primary">
        <div className="border-b border-border-primary px-4 py-4">
          <h2 className="h2-header truncate">{task.title}</h2>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-inactive">
            <span>Проверочные тесты</span>
            <span>
              {completedTests} из {task.tests.length}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-border-primary">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: `${task.tests.length ? (completedTests / task.tests.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {task.tests.map((test) => {
            const state = testStates[test.id] ?? { phase: 'idle' as const };
            const phaseStyle = phaseStyles[state.phase];
            const isSelected = selectedTest?.id === test.id;
            return (
              <div
                key={test.id}
                className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                  isSelected
                    ? 'border-primary bg-bg-primary shadow-sm'
                    : 'border-transparent hover:border-border-primary hover:bg-bg-hover'
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-left"
                  onClick={() => setSelectedTestId(test.id)}
                >
                  <div className="truncate text-xs font-medium">{test.title}</div>
                  <div className={`mt-1 flex items-center gap-1.5 text-xs ${phaseStyle.text}`}>
                    <span className={`size-2 rounded-full ${phaseStyle.dot}`} />
                    {phaseStyle.label}
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Запустить тест «${test.title}»`}
                  title="Запустить тест"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-primary bg-bg-primary text-primary transition-colors enabled:hover:border-primary enabled:hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={!ready || !hasSolution || active}
                  onClick={() => {
                    setSelectedTestId(test.id);
                    onRunTest(test.id);
                  }}
                >
                  <PlayIcon className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border-primary bg-bg-primary p-3">
          {summary && (
            <div
              className={`mb-3 rounded-lg px-3 py-2 text-xs font-medium ${
                submissionResult?.status === 'accepted'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-error/5 text-error'
              }`}
            >
              {summary}
            </div>
          )}
          {error && (
            <div className="bg-error/5 mb-3 flex gap-2 rounded-lg px-3 py-2 text-xs text-error">
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {active && operationKind === 'test' && (
            <button type="button" className="btn-secondary mb-2 w-full" onClick={onCancel}>
              Отменить тест
            </button>
          )}
          <button
            type="button"
            className="btn-primary flex w-full items-center justify-center gap-2"
            disabled={!ready || !hasSolution || active}
            onClick={onSubmit}
          >
            Отправить решение
          </button>
          {!submissionResult && completedTests > 0 && (
            <p className="mt-2 text-center text-xs text-text-inactive">
              Пройдено тестов: {passedTests} из {task.tests.length}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
};
