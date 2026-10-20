import { describe, expect, it } from 'vitest';

import type { CatalogTask } from '../../../../common/tasks';

import { taskForProtocol } from './taskProtocol';

describe('taskForProtocol', () => {
  it('removes presentation masks before sending tests to the interpreter', () => {
    const task: CatalogTask = {
      schemaVersion: 1,
      id: 'masked-gardener',
      version: 1,
      title: 'Masked Gardener',
      summary: 'Summary',
      description: 'Description',
      platformId: 'junior-gardener',
      assetBaseUrl: 'file:///tasks/',
      tests: [
        {
          id: 'first',
          title: 'First',
          input: {
            width: 2,
            height: 1,
            field: [[0, 1]],
            position: { x: 0, y: 0 },
            orientation: 'EAST',
          },
          checks: [{ type: 'gardener.field.equals', expected: [[0, 1]] }],
          hiddenCells: [[false, true]],
        },
      ],
    };

    const protocolTask = taskForProtocol(task);

    expect(protocolTask.tests[0]).not.toHaveProperty('hiddenCells');
    expect(protocolTask.tests[0].input).toEqual(task.tests[0].input);
    expect(task.tests[0].hiddenCells).toEqual([[false, true]]);
  });
});
