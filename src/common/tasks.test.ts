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

  it('covers every beacon order in cosmic delivery with the correct cargo and finish', () => {
    const task = parseProgrammingTask(
      JSON.parse(
        readFileSync(
          'resources/tasks/gardener-cosmic-delivery/gardener-cosmic-delivery.task.json',
          'utf8'
        )
      )
    );
    const beacons = [
      [0, 3],
      [2, 2],
      [4, 1],
    ];
    const walls = [
      [1, 0],
      [1, 1],
      [3, 1],
      [1, 3],
      [3, 3],
      [5, 4],
      [3, 5],
    ];
    const cargoByBeacon = new Map([
      [1, 2], // A rose beacon receives mint.
      [2, 3], // A mint beacon receives cornflower.
      [3, 1], // A cornflower beacon receives rose.
    ]);

    expect(task.id).toBe('gardener-cosmic-delivery');
    expect(task.tests).toHaveLength(6);
    expect(
      new Set(
        task.tests.map((test) => {
          const input = test.input as { field: number[][] };
          return beacons.map(([x, y]) => input.field[y][x]).join(',');
        })
      ).size
    ).toBe(6);

    for (const test of task.tests) {
      const input = test.input as {
        width: number;
        height: number;
        field: number[][];
        position: { x: number; y: number };
        orientation: string;
      };
      const expected = test.checks.find((check) => check.type === 'gardener.field.equals');

      expect([input.width, input.height, input.position, input.orientation]).toEqual([
        6,
        6,
        { x: 0, y: 5 },
        'NORTH',
      ]);
      expect(
        input.field.flatMap((row, y) => row.flatMap((cell, x) => (cell === -1 ? [[x, y]] : [])))
      ).toEqual(walls);
      expect(expected?.type).toBe('gardener.field.equals');
      if (expected?.type !== 'gardener.field.equals') continue;

      const planted = input.field.map((row) => [...row]);
      for (const [x, y] of beacons) {
        expect([1, 2, 3]).toContain(input.field[y][x]);
        expect(input.field[y - 1][x]).toBe(0);
        planted[y - 1][x] = cargoByBeacon.get(input.field[y][x])!;
      }
      expect(expected.expected).toEqual(planted);
      expect(test.checks).toContainEqual({
        type: 'gardener.position.equals',
        expected: { x: 4, y: 0 },
      });
    }
  });

  it('keeps the wall-turn route valid across cartographer map sizes', () => {
    const task = parseProgrammingTask(
      JSON.parse(
        readFileSync(
          'resources/tasks/gardener-uncounting-cartographer/gardener-uncounting-cartographer.task.json',
          'utf8'
        )
      )
    );
    const lengths: number[][] = [];

    expect(task.tests).toHaveLength(5);
    for (const test of task.tests) {
      const input = test.input as {
        width: number;
        height: number;
        field: number[][];
        position: { x: number; y: number };
        orientation: string;
      };
      const position = { ...input.position };
      const segments: number[] = [];

      expect(input.orientation).toBe('NORTH');
      for (const [dx, dy] of [
        [0, -1],
        [1, 0],
        [0, -1],
        [1, 0],
      ]) {
        let steps = 0;
        while (
          position.x + dx >= 0 &&
          position.x + dx < input.width &&
          position.y + dy >= 0 &&
          position.y + dy < input.height &&
          input.field[position.y + dy][position.x + dx] !== -1 &&
          input.field[position.y][position.x] !== 3
        ) {
          position.x += dx;
          position.y += dy;
          steps++;
        }
        segments.push(steps);
      }
      lengths.push(segments);

      expect(position).toEqual({ x: input.width - 1, y: 0 });
      expect(input.field[position.y][position.x]).toBe(3);
      expect(test.checks).toEqual([
        { type: 'gardener.field.equals', expected: input.field },
        { type: 'gardener.position.equals', expected: position },
      ]);
    }
    expect(lengths).toEqual([
      [2, 3, 4, 3],
      [1, 2, 3, 2],
      [1, 4, 4, 4],
      [3, 2, 6, 2],
      [2, 3, 4, 5],
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
