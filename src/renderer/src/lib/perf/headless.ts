/**
 * Запуск редактора без Electron и без настоящего canvas - для тестов и бенчмарков в vitest (jsdom).
 *
 * Отрисовка идёт в заглушку CanvasRenderingContext2D, которая ничего не рисует,
 * поэтому замеры показывают стоимость нашего JS (обход дерева, геометрия, хит-тест),
 * а не растеризацию браузера.
 */
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

import type { CanvasEditor } from '@renderer/lib/CanvasEditor';
import type { ModelController } from '@renderer/lib/data/ModelController';

const ROOT = resolve(__dirname, '../../../../..');
const PLATFORM_DIR = join(ROOT, 'resources/platform');

let callCount = 0;
let computedStyleCount = 0;

/** Сколько раз за замер вызывался getComputedStyle (через него работает getColor темы) */
export function getComputedStyleCount() {
  return computedStyleCount;
}
let recording: string[] | null = null;

/** Сколько вызовов методов контекста было сделано (грубая оценка объёма отрисовки) */
export function getContextCallCount() {
  return callCount;
}

export function resetContextCallCount() {
  callCount = 0;
  computedStyleCount = 0;
}

/**
 * Начать запись всех обращений к контексту (вызовы и присваивания свойств).
 * Числа округляются до тысячных, чтобы перестановка арифметики не ломала сравнение.
 */
export function startRecording() {
  recording = [];
}

export function stopRecording() {
  const result = recording ?? [];
  recording = null;
  return result;
}

function serializeArg(value: unknown): string {
  if (typeof value === 'number') return String(Math.round(value * 1000) / 1000);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(serializeArg).join(',')}]`;
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'object') return `<${value.constructor?.name ?? 'object'}>`;
  return String(value);
}

function createStubContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const state: Record<string | symbol, unknown> = {
    canvas,
    font: '10px sans-serif',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: 'start',
    textBaseline: 'alphabetic',
  };

  const record = (name: string, args: unknown[]) => {
    callCount++;
    recording?.push(`${name}(${args.map(serializeArg).join(',')})`);
  };

  const methods = new Map<string, (...args: unknown[]) => unknown>();
  const method = (name: string, impl?: (...args: any[]) => unknown) => {
    if (!methods.has(name)) {
      methods.set(name, (...args: unknown[]) => {
        record(name, args);
        return impl?.(...args);
      });
    }
    return methods.get(name)!;
  };

  const gradient = { addColorStop: () => undefined };

  const special: Record<string, (...args: any[]) => unknown> = {
    measureText: (value: unknown) => {
      // Браузер приводит аргумент к строке, в т.ч. undefined -> "undefined"
      const text = String(value);
      // Примерная ширина, важно лишь чтобы она была детерминированной
      const size = parseFloat(String(state.font).match(/(\d+(\.\d+)?)px/)?.[1] ?? '10');
      return {
        width: text.length * size * 0.55,
        actualBoundingBoxAscent: size * 0.8,
        actualBoundingBoxDescent: size * 0.2,
        fontBoundingBoxAscent: size * 0.8,
        fontBoundingBoxDescent: size * 0.2,
      };
    },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({}),
    getLineDash: () => [],
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    isPointInPath: () => false,
    isPointInStroke: () => false,
  };

  return new Proxy(state, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop];
      if (prop in special) return method(prop, special[prop]);
      if (prop in target) return target[prop];
      return method(prop);
    },
    set(target, prop, value) {
      target[prop] = value;
      recording?.push(`${String(prop)}=${serializeArg(value)}`);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

let environmentReady: Promise<void> | null = null;

/** Подменяет то, чего нет в jsdom: canvas, ResizeObserver, IPC платформ */
export function setupEnvironment() {
  if (environmentReady) return environmentReady;

  environmentReady = (async () => {
    const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      if (!contexts.has(this)) contexts.set(this, createStubContext(this));
      return contexts.get(this);
    } as any;

    // getColor темы зовёт getComputedStyle на каждый цвет. В jsdom это на порядки дороже,
    // чем в Chromium, и забивает весь профиль, поэтому подменяем и только считаем вызовы.
    // Пустая строка - то же, что вернул бы jsdom без стилей приложения.
    window.getComputedStyle = (() => {
      computedStyleCount++;
      return { getPropertyValue: () => '' };
    }) as unknown as typeof window.getComputedStyle;

    (globalThis as any).ResizeObserver ??= class {
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    };

    const platformPaths = readdirSync(PLATFORM_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => join(PLATFORM_DIR, file));

    (window as any).api = {
      ...(window as any).api,
      fileHandlers: {
        getPlatforms: async () => [true, platformPaths],
        openPlatformFile: async (path: string) => [true, readFileSync(path, 'utf-8'), path, null],
      },
    };

    // PlatformLoader на верхнем уровне ждёт window.api, поэтому импорт только после подмены.
    await import('@renderer/lib/data/ModelController');
    const { preloadPlatforms } = await import('@renderer/lib/data/PlatformLoader');
    await new Promise<void>((done) => preloadPlatforms(done));
  })();

  return environmentReady;
}

export type LoadedDocument = {
  model: ModelController;
  editor: CanvasEditor;
  /** Отрисовать один кадр целиком так же, как это делает цикл рендера */
  drawFrame: () => void;
};

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

/** Загрузить graphml-документ и смонтировать холст его первой машины состояний */
export async function loadDocument(graphml: string): Promise<LoadedDocument> {
  await setupEnvironment();

  const { importGraphml } = await import('@renderer/lib/data/GraphmlParser');
  const { ModelController } = await import('@renderer/lib/data/ModelController');

  const elements = importGraphml(graphml, (error) => {
    throw new Error(error);
  });
  if (!elements) throw new Error('Не удалось импортировать документ');

  ModelController.instance = null;
  const model = new ModelController(() => undefined);
  model.initData(null, 'perf', elements, false);

  const controller = model.controllers[model.model.data.headControllerId];
  const editor = controller.app;

  const root = document.createElement('div');
  Object.defineProperty(root, 'offsetWidth', { value: CANVAS_WIDTH });
  Object.defineProperty(root, 'offsetHeight', { value: CANVAS_HEIGHT });
  document.body.append(root);

  editor.mount(root);
  editor.canvas.element.width = CANVAS_WIDTH;
  editor.canvas.element.height = CANVAS_HEIGHT;
  editor.settings = { ...editor.settings, animations: false };

  // Берём canvas у редактора на каждом кадре: после перемонтирования он новый
  const drawFrame = () => {
    editor.canvas.clear();
    editor.view.draw(editor.canvas.context, editor.canvas.element);
    editor.view.isDirty = false;
  };

  return { model, editor, drawFrame };
}

export function readDemo(relativePath: string) {
  return readFileSync(join(ROOT, 'demos', relativePath), 'utf-8');
}

export function listDemos() {
  const result: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(join(ROOT, 'demos', dir), { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(rel, rel);
      else if (entry.name.endsWith('.graphml')) result.push(rel);
    }
  };
  walk('', '');
  return result.sort();
}
