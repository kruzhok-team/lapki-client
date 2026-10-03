import { expect, test } from 'vitest';

import { loadDocument, readDemo } from './headless';

test('window.__perf.run() прогоняет сценарии на открытом холсте', async () => {
  const { editor } = await loadDocument(readDemo('perf/perf-medium-depth3.graphml'));
  const { installPerfDevtools } = await import('./devtools');
  installPerfDevtools();

  const offset = { ...editor.controller.offset };
  const markdown = await window.__perf!.run({ scenarios: ['frame', 'drag-nested'] });

  expect(markdown).toContain('| frame |');
  expect(markdown).toContain('| drag-nested |');
  expect(markdown).toContain('104 состояний');
  // Цикл рендера действительно рисовал кадры во время прогона
  const drawsColumn = markdown
    .split('\n')
    .filter((line) => line.startsWith('| frame'))
    .map((line) => Number(line.split('|')[9]));
  expect(drawsColumn[0]).toBeGreaterThan(30);
  // Камера вернулась на место
  expect(editor.controller.offset).toEqual(offset);
}, 60_000);
