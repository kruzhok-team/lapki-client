import { afterEach, describe, expect, it } from 'vitest';

import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { loadTaskCatalog } from './tasks';

const temporaryDirectories: string[] = [];

const temporaryTaskRoot = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'lapki-task-catalog-'));
  temporaryDirectories.push(root);
  return root;
};

const bundledTask = () =>
  JSON.parse(readFileSync('resources/tasks/gardener-letter-a.task.json', 'utf8'));

describe('loadTaskCatalog', () => {
  afterEach(() => {
    temporaryDirectories
      .splice(0)
      .forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  });

  it('discovers task files recursively without a manifest', () => {
    const root = temporaryTaskRoot();
    const nested = path.join(root, 'gardener');
    mkdirSync(nested);
    writeFileSync(path.join(nested, 'letter-a.task.json'), JSON.stringify(bundledTask()));

    const catalog = loadTaskCatalog(root);

    expect(catalog.tasks.map((task) => task.id)).toEqual(['gardener-letter-a']);
    expect(catalog.diagnostics).toEqual([]);
  });

  it('rejects every file involved in a duplicate identifier', () => {
    const root = temporaryTaskRoot();
    writeFileSync(path.join(root, 'first.task.json'), JSON.stringify(bundledTask()));
    writeFileSync(path.join(root, 'second.task.json'), JSON.stringify(bundledTask()));

    const catalog = loadTaskCatalog(root);

    expect(catalog.tasks).toEqual([]);
    expect(catalog.diagnostics.map((diagnostic) => diagnostic.file).sort()).toEqual([
      'first.task.json',
      'second.task.json',
    ]);
  });

  it('loads valid tasks while reporting invalid files', () => {
    const root = temporaryTaskRoot();
    writeFileSync(path.join(root, 'valid.task.json'), JSON.stringify(bundledTask()));
    writeFileSync(path.join(root, 'invalid.task.json'), '{');

    const catalog = loadTaskCatalog(root);

    expect(catalog.tasks).toHaveLength(1);
    expect(catalog.diagnostics[0].file).toBe('invalid.task.json');
  });

  it('loads cosmic delivery with its local illustration', () => {
    const catalog = loadTaskCatalog(path.resolve('resources/tasks'));
    const task = catalog.tasks.find((entry) => entry.id === 'gardener-cosmic-delivery');

    expect(catalog.diagnostics).toEqual([]);
    expect(task?.tests).toHaveLength(6);
    expect(task?.description).toContain('![Схема космической станции](cosmic-delivery.png)');
    expect(task?.assetBaseUrl).toContain('/gardener-cosmic-delivery/');
  });
});
