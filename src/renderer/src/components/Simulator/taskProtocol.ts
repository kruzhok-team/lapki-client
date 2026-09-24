import type { CatalogTask, ProgrammingTask } from '../../../../common/tasks';

export const taskForProtocol = (task: CatalogTask): ProgrammingTask => ({
  schemaVersion: task.schemaVersion,
  id: task.id,
  version: task.version,
  title: task.title,
  summary: task.summary,
  description: task.description,
  platformId: task.platformId,
  tests: task.tests.map((test) => ({
    id: test.id,
    title: test.title,
    ...(test.timeoutSeconds === undefined ? {} : { timeoutSeconds: test.timeoutSeconds }),
    input: test.input,
    checks: test.checks,
  })),
});
