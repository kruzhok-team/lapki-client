import { beforeEach, describe, expect, it } from 'vitest';

import { useTasks } from './useTasks';

const task = {
  schemaVersion: 1 as const,
  id: 'task',
  version: 1,
  title: 'Task',
  summary: 'Summary',
  description: 'Description',
  platformId: 'junior-reader' as const,
  assetBaseUrl: 'file:///tasks/',
  tests: [
    {
      id: 'first',
      title: 'First',
      input: { message: 'abc' },
      checks: [{ type: 'reader.impulses.equals' as const, expected: ['impulseA' as const] }],
    },
  ],
};

describe('useTasks', () => {
  beforeEach(() => {
    useTasks.getState().endTask();
    useTasks.getState().setCatalog({
      tasks: [task],
      diagnostics: [],
      assetRootUrl: 'file:///tasks/',
    });
  });

  it('starts and ends an in-memory task-solving session', () => {
    useTasks.getState().startTask(task.id);

    expect(useTasks.getState().activeTaskId).toBe(task.id);
    expect(useTasks.getState().testStates.first.phase).toBe('idle');

    useTasks.getState().endTask();
    expect(useTasks.getState().activeTaskId).toBeUndefined();
  });

  it('keeps a trial verdict separate and clears it for submission', () => {
    useTasks.getState().startTask(task.id);
    useTasks.getState().startTrial('first');
    useTasks
      .getState()
      .completeTrial(
        'first',
        { testId: 'first', status: 'passed', outcome: { status: 'success' } },
        { status: 'success', result: { signals: [], calledSignals: ['impulseA'] } }
      );

    expect(useTasks.getState().testStates.first.source).toBe('trial');
    expect(useTasks.getState().detailedResult?.testId).toBe('first');

    useTasks.getState().startSubmission();
    expect(useTasks.getState().testStates.first.phase).toBe('waiting');
    expect(useTasks.getState().detailedResult).toBeUndefined();
  });

  it('invalidates results when the solution XML changes', () => {
    useTasks.getState().startTask(task.id);
    useTasks.getState().selectSolution('machine', '<first/>');
    useTasks.getState().startTrial('first');

    useTasks.getState().invalidateSolutionResults('<second/>');

    expect(useTasks.getState().testStates.first.phase).toBe('idle');
    expect(useTasks.getState().solutionXml).toBe('<second/>');
  });
});
