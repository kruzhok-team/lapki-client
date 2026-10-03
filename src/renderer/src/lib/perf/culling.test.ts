/**
 * Отсечение по viewport (EditorView.draw) не должно прятать ничего видимого.
 *
 * Для каждой фигуры, которую отсечение пропускает, вызываем её draw() вручную,
 * записываем все вызовы canvas и проверяем, что ни одна нарисованная линия,
 * фигура или текст не попадает на холст.
 *
 * Пока отсечения в EditorView нет (оно добавляется отдельной оптимизацией),
 * тест пропускается.
 */
import { describe, expect, test } from 'vitest';

// Только типы: значения из drawable нельзя импортировать до setupEnvironment
import type { Drawable } from '@renderer/lib/types';
import type { Rectangle } from '@renderer/lib/types/graphics';

import {
  listDemos,
  loadDocument,
  readDemo,
  setupEnvironment,
  startRecording,
  stopRecording,
} from './headless';
import { createScenarios } from './scenarios';

const BROKEN_DEMOS = new Set(['CyberiadaSchemas/CyberiadaFormat-Autoborder.graphml']);

await setupEnvironment();
const { EditorView } = await import('@renderer/lib/basic/EditorView');
const hasCulling = 'isInViewport' in EditorView.prototype;

// Камеры: как при открытии, вся схема, и несколько сдвигов, чтобы фигуры попадали на край холста
type Camera = { name: string } | { name: string; scale: number; offset: { x: number; y: number } };

const CAMERAS: Camera[] = [
  { name: 'frame' },
  { name: 'frame-fit' },
  { name: 'shift', scale: 1, offset: { x: -700, y: -300 } },
  { name: 'shift-zoom-in', scale: 0.4, offset: { x: -200, y: -150 } },
  { name: 'shift-zoom-out', scale: 2.5, offset: { x: 900, y: 400 } },
];

const num = (value: string) => Number(value);

/** Прямоугольник, который задевает вызов canvas, или null, если вызов ничего не рисует по координатам */
function callBounds(call: string, font: number, align: string): Rectangle | null {
  const match = call.match(/^(\w+)\((.*)\)$/);
  if (!match) return null;
  const [, method, rawArgs] = match;
  const args = rawArgs === '' ? [] : rawArgs.split(',');

  const box = (x: number, y: number, w = 0, h = 0) => ({
    x: Math.min(x, x + w),
    y: Math.min(y, y + h),
    width: Math.abs(w),
    height: Math.abs(h),
  });

  switch (method) {
    case 'moveTo':
    case 'lineTo':
      return box(num(args[0]), num(args[1]));
    case 'rect':
    case 'roundRect':
    case 'fillRect':
    case 'strokeRect':
    case 'clearRect':
      return box(num(args[0]), num(args[1]), num(args[2]), num(args[3]));
    case 'arc':
    case 'ellipse': {
      const r = num(args[2]);
      return box(num(args[0]) - r, num(args[1]) - r, 2 * r, 2 * r);
    }
    case 'quadraticCurveTo':
    case 'bezierCurveTo': {
      const xs = args.filter((_, i) => i % 2 === 0).map(num);
      const ys = args.filter((_, i) => i % 2 === 1).map(num);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      return box(x, y, Math.max(...xs) - x, Math.max(...ys) - y);
    }
    case 'fillText':
    case 'strokeText': {
      // Первый аргумент - строка в кавычках, в ней могут быть запятые
      const text = JSON.parse(rawArgs.slice(0, rawArgs.lastIndexOf('",') + 1));
      const [x, y] = rawArgs
        .slice(rawArgs.lastIndexOf('",') + 2)
        .split(',')
        .map(num);
      // Ширина текста с запасом; по вертикали - с запасом на любую базовую линию
      const width = text.length * font;
      const left =
        align === 'right' || align === 'end' ? x - width : align === 'center' ? x - width / 2 : x;
      return box(left, y - font * 2, width, font * 4);
    }
    case 'drawImage': {
      const rest = args.slice(1).map(num);
      if (rest.length === 2) return box(rest[0], rest[1]);
      if (rest.length === 4) return box(rest[0], rest[1], rest[2], rest[3]);
      return box(rest[4], rest[5], rest[6], rest[7]);
    }
    default:
      return null;
  }
}

const intersects = (a: Rectangle, b: Rectangle) =>
  a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;

describe.skipIf(!hasCulling)(
  hasCulling
    ? 'отсечение по viewport не прячет видимое'
    : 'отсечение по viewport не прячет видимое (пропущен: в EditorView нет отсечения)',
  () => {
    for (const demo of listDemos().filter((d) => !BROKEN_DEMOS.has(d))) {
      test(
        demo,
        async () => {
          const { editor } = await loadDocument(readDemo(demo));
          const view = editor.view as unknown as {
            isInViewport: (node: Drawable, viewport: Rectangle) => boolean;
            getViewport: (canvas: HTMLCanvasElement) => Rectangle;
          };
          const problems: string[] = [];
          let culled = 0;

          for (const camera of CAMERAS) {
            if ('scale' in camera) {
              editor.view.setScale(camera.scale);
              editor.controller.offset = { ...camera.offset };
            } else {
              createScenarios()
                .find((s) => s.name === camera.name)!
                .setup(editor);
            }

            const { width, height } = editor.canvas;
            const canvasRect = { x: 0, y: 0, width, height };
            // Тот же viewport, что в EditorView.draw
            const viewport = view.getViewport(editor.canvas.element);

            const walk = (node: Drawable) => {
              node.children?.forEach((child) => {
                if (!view.isInViewport(child, viewport)) {
                  culled++;
                  startRecording();
                  child.draw(editor.canvas.context, editor.canvas.element);
                  const calls = stopRecording();

                  let font = 16;
                  let align = 'start';
                  for (const call of calls) {
                    const fontMatch = call.match(/^font="[^"]*?(\d+(\.\d+)?)px/);
                    if (fontMatch) font = Number(fontMatch[1]);
                    const alignMatch = call.match(/^textAlign="(\w+)"/);
                    if (alignMatch) align = alignMatch[1];
                    const bounds = callBounds(call, font, align);
                    if (bounds && intersects(bounds, canvasRect)) {
                      const id = (child as { id?: string }).id;
                      problems.push(
                        `${camera.name}: ${child.constructor.name} ${id} рисует на холсте: ${call}`
                      );
                      break;
                    }
                  }
                }
                walk(child);
              });
            };
            walk(editor.view);
          }

          expect(problems).toEqual([]);
          // Тест что-то проверил: на демо из одного-двух состояний отсекать может быть нечего
          if (demo.startsWith('perf/')) expect(culled).toBeGreaterThan(0);
        },
        120_000
      );
    }
  }
);
