import { describe, expect, it } from 'vitest';

import { filterTasks } from './filterTasks';

const tasks = [
  {
    id: 'gardener',
    title: 'Розовая рамка',
    summary: 'Высадите розы по периметру.',
    platformId: 'junior-gardener' as const,
  },
  {
    id: 'reader',
    title: 'Распознавание слов',
    summary: 'Обрабатывайте слова во входной строке.',
    platformId: 'junior-reader' as const,
  },
];

describe('filterTasks', () => {
  it('searches titles and summaries without case sensitivity', () => {
    expect(filterTasks(tasks, 'РОЗОВАЯ')).toEqual([tasks[0]]);
    expect(filterTasks(tasks, 'входной')).toEqual([tasks[1]]);
  });

  it('trims the query and returns every task for an empty query', () => {
    expect(filterTasks(tasks, '  строчник  ')).toEqual([tasks[1]]);
    expect(filterTasks(tasks, '   ')).toBe(tasks);
  });

  it('searches by the human-readable platform name', () => {
    expect(filterTasks(tasks, 'садовник')).toEqual([tasks[0]]);
    expect(filterTasks(tasks, 'СТРОЧНИК')).toEqual([tasks[1]]);
  });

  it('returns an empty list when there are no matches', () => {
    expect(filterTasks(tasks, 'несуществующая задача')).toEqual([]);
  });
});
