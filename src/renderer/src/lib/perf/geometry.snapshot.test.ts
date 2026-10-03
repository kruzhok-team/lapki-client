/**
 * Страховка для оптимизаций холста.
 *
 * Для каждого документа из demos/ и нескольких положений камеры фиксируем:
 *  - drawBounds каждой фигуры (геометрия с учётом вложенности);
 *  - результат хит-теста по сетке точек экрана;
 *  - хеш всех вызовов отрисовки за кадр.
 *
 * Если оптимизация меняет что-то из этого - тест упадёт. Хеш отрисовки
 * может законно поменяться (например, при отсечении по вьюпорту), тогда
 * снимок обновляется осознанно: npx vitest run -u src/renderer/src/lib/perf
 */
import { describe, expect, test } from 'vitest';

import { createHash } from 'crypto';

// Только типы: значения из drawable нельзя импортировать до setupEnvironment
import type { Shape } from '@renderer/lib/drawable/Shape';
import type { Drawable } from '@renderer/lib/types';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  listDemos,
  loadDocument,
  readDemo,
  startRecording,
  stopRecording,
} from './headless';

const CAMERAS = [
  { scale: 1, offset: { x: 0, y: 0 } },
  { scale: 0.5, offset: { x: 300, y: -200 } },
  { scale: 1.7, offset: { x: -150, y: 90 } },
];

const HIT_GRID_X = 48;
const HIT_GRID_Y = 27;

const round = (value: number) => Math.round(value * 1000) / 1000;

function collectBounds(root: Drawable) {
  const lines: string[] = [];

  const walk = (node: Drawable, depth: number) => {
    node.children?.forEach((child) => {
      if ('drawBounds' in child) {
        const shape = child as Shape;
        const b = shape.drawBounds;
        lines.push(
          `${'  '.repeat(depth)}${shape.constructor.name} ${shape.id} ` +
            [b.x, b.y, b.width, b.height, b.childrenHeight].map(round).join(' ')
        );
      }
      walk(child, depth + 1);
    });
  };

  walk(root, 0);
  return lines;
}

// Демо, которые не открываются и в самом приложении (устарели относительно платформ)
const BROKEN_DEMOS = new Set([
  // Неизвестный компонент МодульДвижения в платформе BearlogaDefend-Autoborder
  'CyberiadaSchemas/CyberiadaFormat-Autoborder.graphml',
]);

const demos = listDemos();

describe('геометрия холста не меняется', () => {
  for (const demo of demos) {
    (BROKEN_DEMOS.has(demo) ? test.skip : test)(
      demo,
      async () => {
        const { editor, drawFrame } = await loadDocument(readDemo(demo));
        const result: Record<string, unknown> = {};

        CAMERAS.forEach((camera, i) => {
          editor.view.setScale(camera.scale);
          editor.controller.offset = { ...camera.offset };

          const bounds = collectBounds(editor.view);

          const hits: string[] = [];
          for (let gy = 0; gy < HIT_GRID_Y; gy++) {
            const row: string[] = [];
            for (let gx = 0; gx < HIT_GRID_X; gx++) {
              const position = {
                x: ((gx + 0.5) * CANVAS_WIDTH) / HIT_GRID_X,
                y: ((gy + 0.5) * CANVAS_HEIGHT) / HIT_GRID_Y,
              };
              const node = editor.view.getCapturedNode({ position });
              row.push(node ? node.id : '.');
            }
            hits.push(row.join(' '));
          }

          startRecording();
          drawFrame();
          const calls = stopRecording();

          result[`camera ${i}: scale=${camera.scale}`] = {
            bounds,
            hits,
            drawCalls: calls.length,
            drawHash: createHash('sha1').update(calls.join('\n')).digest('hex'),
          };
        });

        expect(result).toMatchSnapshot();
      },
      120_000
    );
  }
});
