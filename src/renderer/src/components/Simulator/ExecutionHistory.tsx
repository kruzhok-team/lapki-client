import React from 'react';

import { twMerge } from 'tailwind-merge';

import { GardenerStep } from '@renderer/types/InterpreterTypes';

interface ExecutionHistoryProps {
  steps: GardenerStep[];
  historyIndex: number;
  isPlaying: boolean;
  isTruncated: boolean;
  onSelectStep: (index: number) => void;
  onTogglePlayback: () => void;
}

const buttonClassName =
  'h-8 rounded-lg px-3 text-xs transition-colors enabled:bg-primary enabled:text-text-secondary disabled:cursor-not-allowed disabled:bg-inactive-button disabled:text-text-disabled';

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  steps,
  historyIndex,
  isPlaying,
  isTruncated,
  onSelectStep,
  onTogglePlayback,
}) => {
  const hasSteps = steps.length > 0;
  const currentStep = hasSteps ? steps[historyIndex] : undefined;

  return (
    <section className="mt-6">
      <h2 className="h2-header mb-2">История</h2>
      <div className="min-h-[200px] rounded-lg border border-border-primary p-3">
        <div className="grid gap-3 text-xs">
          <input
            aria-label="Шаг истории"
            type="range"
            min={0}
            max={Math.max(steps.length - 1, 0)}
            value={historyIndex}
            disabled={!hasSteps}
            onChange={(event) => onSelectStep(Number(event.target.value))}
          />
          <div className="grid gap-2">
            <button
              type="button"
              className={twMerge(buttonClassName, 'w-full')}
              disabled={!hasSteps}
              onClick={onTogglePlayback}
            >
              {isPlaying ? 'Пауза' : 'Воспроизвести'}
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <button
              type="button"
              className={twMerge(buttonClassName, 'min-w-0 px-2')}
              disabled={!hasSteps || historyIndex === 0}
              onClick={() => onSelectStep(historyIndex - 1)}
            >
              Назад
            </button>
            <span className="whitespace-nowrap text-center">
              Шаг {hasSteps ? historyIndex + 1 : 0} / {steps.length}
            </span>
            <button
              type="button"
              className={twMerge(buttonClassName, 'min-w-0 px-2')}
              disabled={!hasSteps || historyIndex === steps.length - 1}
              onClick={() => onSelectStep(historyIndex + 1)}
            >
              Вперёд
            </button>
          </div>
          <p className="text-text-inactive">
            {currentStep
              ? `Позиция: ${currentStep.position.x}, ${currentStep.position.y} · ${currentStep.orientation}`
              : 'Позиция: —'}
          </p>
          {isTruncated && <p className="text-warning">Показаны первые 5 000 шагов.</p>}
        </div>
      </div>
    </section>
  );
};
