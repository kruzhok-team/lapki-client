import type { CatalogTask } from '../../../../common/tasks';

const platformNames: Record<CatalogTask['platformId'], string> = {
  'junior-gardener': 'Садовник',
  'junior-reader': 'Строчник',
};

export const filterTasks = <Task extends Pick<CatalogTask, 'title' | 'summary' | 'platformId'>>(
  tasks: Task[],
  search: string
): Task[] => {
  const query = search.trim().toLowerCase();
  if (!query) return tasks;

  return tasks.filter((task) =>
    `${task.title}\n${task.summary}\n${platformNames[task.platformId]}`
      .toLowerCase()
      .includes(query)
  );
};
