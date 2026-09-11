import React from 'react';

import { ParameterSelect } from '@renderer/components/UI';

export type SimulationMode = 'finite' | 'endless';

const simulationModeOptions: { value: SimulationMode; label: string }[] = [
  { value: 'finite', label: 'Обычный' },
  { value: 'endless', label: 'Бесконечный' },
];

interface SimulationRunPanelProps {
  machineSelector: React.ReactNode;
  mode: SimulationMode;
  timeout: number;
  ready: boolean;
  active: boolean;
  error?: string;
  message?: string;
  stale?: boolean;
  reserveFeedbackSpace?: boolean;
  onModeChange: (mode: SimulationMode) => void;
  onTimeoutChange: (timeout: number) => void;
  onStart: () => void;
  onCancel: () => void;
}

const controlClassName =
  'h-8 w-full rounded-lg border border-border-primary bg-bg-primary px-3 text-xs text-text-primary outline-none focus:border-text-inactive disabled:cursor-not-allowed disabled:bg-inactive-input disabled:text-text-inactive';

const buttonClassName =
  'h-8 rounded-lg px-3 text-xs transition-colors enabled:bg-primary enabled:text-text-secondary disabled:cursor-not-allowed disabled:bg-bg-active disabled:text-text-disabled';

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

export const SimulationRunPanel: React.FC<SimulationRunPanelProps> = ({
  machineSelector,
  mode,
  timeout,
  ready,
  active,
  error,
  message,
  stale,
  reserveFeedbackSpace = false,
  onModeChange,
  onTimeoutChange,
  onStart,
  onCancel,
}) => (
  <div className="min-w-0">
    {machineSelector}
    <section className="mt-6">
      <h2 className="h2-header mb-2">Запуск</h2>
      <div className="rounded-lg border border-border-primary p-3">
        <FieldInput label="Режим" htmlFor="simulator-mode">
          <ParameterSelect
            inputId="simulator-mode"
            className="w-full"
            isSearchable={false}
            isClearable={false}
            isDisabled={active}
            options={simulationModeOptions}
            value={simulationModeOptions.find((option) => option.value === mode)}
            onChange={(option) => {
              if (option) onModeChange(option.value);
            }}
          />
        </FieldInput>
        <div className="mt-3">
          <FieldInput label="Таймаут, сек" htmlFor="simulator-timeout">
            <input
              id="simulator-timeout"
              className={controlClassName}
              type="number"
              min={1}
              max={30}
              value={timeout}
              disabled={active || mode === 'endless'}
              onChange={(event) =>
                onTimeoutChange(Math.max(1, Math.min(30, Number(event.target.value))))
              }
            />
          </FieldInput>
        </div>
        <div className="mt-3">
          <button
            type="button"
            className={`${buttonClassName} w-full`}
            disabled={!active && !ready}
            onClick={active ? onCancel : onStart}
          >
            {active ? 'Отменить' : 'Запустить'}
          </button>
        </div>
        {(reserveFeedbackSpace || error || message || stale) && (
          <div className="mt-3 min-h-4 space-y-3">
            {error && <p className="text-xs text-error">{error}</p>}
            {message && <p className="text-xs">{message}</p>}
            {stale && <p className="text-xs text-warning">Результат устарел.</p>}
          </div>
        )}
      </div>
    </section>
  </div>
);
