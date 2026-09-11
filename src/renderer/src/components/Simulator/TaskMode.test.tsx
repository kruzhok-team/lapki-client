import { createElement, type ReactNode } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CatalogTask } from '../../../../common/tasks';

const taskState = vi.hoisted(() => ({
  testStates: {} as Record<string, unknown>,
  detailedResult: undefined as unknown,
  submissionResult: undefined as unknown,
}));

vi.mock('../../store/useTasks', () => ({
  useTasks: (selector: (state: typeof taskState) => unknown) => selector(taskState),
}));

vi.mock('@renderer/components/UI/ScrollArea', () => ({
  ScrollArea: ({ children, className }: { children: ReactNode; className?: string }) =>
    createElement('div', { className }, children),
}));

import { TaskMode } from './TaskMode';

const task: CatalogTask = {
  schemaVersion: 1,
  id: 'gardener-task',
  version: 1,
  title: 'Gardener task',
  summary: 'Summary',
  description: 'Description',
  platformId: 'junior-gardener',
  assetBaseUrl: 'file:///tasks/',
  tests: [
    {
      id: 'first',
      title: 'First',
      input: {
        width: 1,
        height: 1,
        field: [[0]],
        position: { x: 0, y: 0 },
        orientation: 'EAST',
      },
      checks: [{ type: 'gardener.field.equals', expected: [[0]] }],
    },
  ],
};

const renderTaskMode = () =>
  renderToStaticMarkup(
    <TaskMode
      task={task}
      ready
      active={false}
      hasSolution
      onRunTest={vi.fn()}
      onCancel={vi.fn()}
      onSubmit={vi.fn()}
    />
  );

const readerTask: CatalogTask = {
  ...task,
  id: 'reader-task',
  platformId: 'junior-reader',
  tests: [
    {
      id: 'first',
      title: 'First',
      input: { message: 'А' },
      checks: [{ type: 'reader.impulses.equals', expected: ['impulseA'] }],
    },
  ],
};

const renderReaderTaskMode = () =>
  renderToStaticMarkup(
    <TaskMode
      task={readerTask}
      ready
      active={false}
      hasSolution
      onRunTest={vi.fn()}
      onCancel={vi.fn()}
      onSubmit={vi.fn()}
    />
  );

describe('TaskMode Gardener result', () => {
  beforeEach(() => {
    taskState.testStates = { first: { phase: 'idle' } };
    taskState.detailedResult = undefined;
    taskState.submissionResult = undefined;
  });

  it('shows that the test has not run before a result exists', () => {
    const html = renderTaskMode();

    expect(html).toContain('Нет запуска');
    expect(html.match(/mb-4 flex h-4 items-center/g)).toHaveLength(2);
    expect(html).toContain('px-1.5 text-[10px] leading-4');
    expect(html).not.toContain('items-start justify-between');
    expect(html).not.toContain('Исходные данные');
    expect(html).not.toContain('>Результат<');
    expect(html).toContain('overflow-hidden rounded-lg border');
    expect(html).not.toContain('rounded-t-xl');
  });

  it('shows the final state for a submission result without a step trace', () => {
    taskState.testStates = {
      first: {
        phase: 'passed',
        source: 'submission',
        verdict: {
          testId: 'first',
          status: 'passed',
          outcome: {
            status: 'success',
            result: {
              signals: [],
              calledSignals: [],
              environment: {
                field: [[0]],
                position: { x: 0, y: 0 },
                orientation: 'east',
              },
            },
          },
        },
      },
    };

    const html = renderTaskMode();

    expect(html).toContain('Итог');
    expect(html).not.toContain('Нет запуска');
    expect(html).toContain('Пройден');
  });
});

describe('TaskMode Reader result', () => {
  beforeEach(() => {
    taskState.testStates = { first: { phase: 'idle' } };
    taskState.detailedResult = undefined;
    taskState.submissionResult = undefined;
  });

  it('shows the input string with an outline and without a filled background', () => {
    const html = renderReaderTaskMode();

    expect(html).toContain(
      'whitespace-pre-wrap rounded-lg border border-border-primary p-3 text-xs'
    );
    expect(html).not.toContain(
      'whitespace-pre-wrap rounded-lg border border-border-primary bg-bg-secondary'
    );
  });

  it('uses the same impulse list presentation as ReaderResult', () => {
    taskState.detailedResult = {
      testId: 'first',
      execution: {
        status: 'success',
        result: { signals: [], calledSignals: ['impulseA'] },
      },
    };

    const html = renderReaderTaskMode();

    expect(html).toContain('Импульс А');
    expect(html).not.toContain('impulseA');
    expect(html).toContain('rounded-lg border border-border-primary bg-bg-primary p-2');
    expect(html).toContain('max-h-[236px]');
    expect(html).not.toContain('list-decimal');
  });

  it('keeps the task-specific empty message', () => {
    const html = renderReaderTaskMode();

    expect(html).toContain('Импульсы ещё не получены.');
  });
});
