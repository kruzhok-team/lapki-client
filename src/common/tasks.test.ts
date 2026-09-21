import { describe, expect, it } from 'vitest';

import { readFileSync } from 'fs';

import {
  DEFAULT_TEST_TIMEOUT_SECONDS,
  MAX_TASK_TOTAL_TIMEOUT_SECONDS,
  parseProgrammingTask,
} from './tasks';

const validTask = () => ({
  schemaVersion: 1,
  id: 'reader-echo',
  version: 1,
  title: 'Reader',
  summary: 'Summary',
  description: 'Description',
  platformId: 'junior-reader',
  tests: [
    {
      id: 'first',
      title: 'First',
      input: { message: 'abc' },
      checks: [{ type: 'reader.impulses.equals', expected: ['impulseA'] }],
    },
  ],
});

describe('parseProgrammingTask', () => {
  it('accepts a strict Reader task and preserves an omitted timeout', () => {
    const task = parseProgrammingTask(validTask());

    expect(task.tests[0].timeoutSeconds).toBeUndefined();
    expect(DEFAULT_TEST_TIMEOUT_SECONDS).toBe(10);
  });

  it('rejects unknown schema fields', () => {
    expect(() => parseProgrammingTask({ ...validTask(), typo: true })).toThrow(
      'не поддерживается schemaVersion 1'
    );
  });

  it('rejects checks for another platform', () => {
    const task = validTask();
    task.tests[0].checks = [{ type: 'gardener.field.equals', expected: [] }];

    expect(() => parseProgrammingTask(task)).toThrow('не поддерживается платформой junior-reader');
  });

  it('rejects a task whose effective timeout total is too large', () => {
    const task = validTask();
    task.tests = Array.from({ length: 31 }, (_, index) => ({
      ...task.tests[0],
      id: `test-${index}`,
      timeoutSeconds: 10,
    }));

    expect(() => parseProgrammingTask(task)).toThrow(
      `превышает ${MAX_TASK_TOTAL_TIMEOUT_SECONDS} секунд`
    );
  });

  it('validates the bundled Gardener letter A task', () => {
    const task = parseProgrammingTask(
      JSON.parse(readFileSync('resources/tasks/gardener-letter-a.task.json', 'utf8'))
    );

    expect(task.id).toBe('gardener-letter-a');
    expect(task.tests.map((test) => (test.input as { width: number }).width)).toEqual([5, 8, 7]);
  });

  it('validates the bundled Gardener letter B task', () => {
    const task = parseProgrammingTask(
      JSON.parse(readFileSync('resources/tasks/gardener-letter-b.task.json', 'utf8'))
    );

    expect(task.id).toBe('gardener-letter-b');
    expect(
      task.tests.map((test) => {
        const input = test.input as {
          width: number;
          height: number;
          position: { x: number; y: number };
        };
        return [input.width, input.height, input.position.x, input.position.y];
      })
    ).toEqual([
      [7, 7, 0, 0],
      [5, 7, 0, 0],
      [8, 9, 0, 0],
    ]);
  });

  it('validates the bundled Gardener greeting task', () => {
    const task = parseProgrammingTask(
      JSON.parse(readFileSync('resources/tasks/gardener-hello.task.json', 'utf8'))
    );

    expect(task.id).toBe('gardener-hello');
    expect(task.tests).toHaveLength(1);
  });

  it('accepts a Gardener visibility mask without changing the field', () => {
    const raw = JSON.parse(
      readFileSync('resources/tasks/gardener-cornflower-path.task.json', 'utf8')
    );
    raw.tests[0].hiddenCells = Array.from({ length: 7 }, (_, y) =>
      Array.from({ length: 7 }, (_, x) => y === 3 && x > 0)
    );

    const task = parseProgrammingTask(raw);

    expect(task.tests[0].hiddenCells?.[3][1]).toBe(true);
    expect((task.tests[0].input as { field: number[][] }).field[3][1]).toBe(0);
  });

  it('rejects a visibility mask that hides the Gardener starting cell', () => {
    const raw = JSON.parse(
      readFileSync('resources/tasks/gardener-cornflower-path.task.json', 'utf8')
    );
    raw.tests[0].hiddenCells = Array.from({ length: 7 }, () => Array(7).fill(false));
    raw.tests[0].hiddenCells[0][0] = true;

    expect(() => parseProgrammingTask(raw)).toThrow('не может скрывать стартовую клетку');
  });

  it('rejects a visibility mask for Reader', () => {
    const raw = validTask();
    const test = { ...raw.tests[0], hiddenCells: [[false]] };

    expect(() => parseProgrammingTask({ ...raw, tests: [test] })).toThrow(
      'не поддерживается платформой junior-reader'
    );
  });

  it('validates the bundled Gardener in fog puzzle', () => {
    const task = parseProgrammingTask(
      JSON.parse(readFileSync('resources/tasks/gardener-in-fog/gardener-in-fog.task.json', 'utf8'))
    );
    const test = task.tests[0];
    const input = test.input as {
      width: number;
      height: number;
      field: number[][];
      position: { x: number; y: number };
    };

    expect(input.position).toEqual({ x: 2, y: 4 });
    expect(test.checks).toEqual([{ type: 'gardener.position.equals', expected: { x: 7, y: 4 } }]);
    expect(
      input.field.every((row) => row.every((cell, x) => cell === row[input.width - 1 - x]))
    ).toBe(true);
    expect(test.hiddenCells).toEqual(
      Array.from({ length: input.height }, () =>
        Array.from({ length: input.width }, (_, x) => x >= input.width / 2)
      )
    );
  });

  it('validates the bundled Gardener mint abundance task', () => {
    const task = parseProgrammingTask(
      JSON.parse(readFileSync('resources/tasks/gardener-mint-abundance.task.json', 'utf8'))
    );

    expect(task.id).toBe('gardener-mint-abundance');
    expect(
      task.tests.map((test) => {
        const input = test.input as { width: number; height: number; orientation: string };
        return [input.width, input.height, input.orientation];
      })
    ).toEqual([
      [3, 2, 'SOUTH'],
      [6, 4, 'SOUTH'],
      [5, 7, 'SOUTH'],
    ]);
  });

  it('validates the bundled Reader digits groups task', () => {
    const task = parseProgrammingTask(
      JSON.parse(readFileSync('resources/tasks/reader-digits-groups-over-33.task.json', 'utf8'))
    );

    expect(task.id).toBe('reader-digits-groups-over-33');
    expect(task.tests.map((test) => (test.input as { message: string }).message)).toEqual([
      '5-9999',
      '10-20-4',
      '99999',
      '9999-9999',
      '9876-999',
    ]);
  });
});
