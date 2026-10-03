/**
 * Бенчмарк холста: npm run perf:bench
 *
 * Для каждого документа из demos/perf гоняет сценарии через те же обработчики,
 * что и реальная мышь (EditorView.handleMouse*), и рисует кадр, если он "грязный" -
 * ровно как цикл рендера в CanvasEditor. Канвас - заглушка, поэтому цифры -
 * это стоимость нашего JS без растеризации (в приложении будет больше).
 *
 * Результаты: таблица в консоли и perf-results/bench-latest.json.
 * Фильтры: PERF_DOCS=deep,flat PERF_SCENARIOS=drag-nested PERF_PROFILE=0 (без профиля)
 */
import { mkdirSync, writeFileSync } from 'fs';
import { Session } from 'inspector';
import { join, resolve } from 'path';
import { test } from 'vitest';

import {
  getComputedStyleCount,
  getContextCallCount,
  loadDocument,
  readDemo,
  resetContextCallCount,
} from './headless';
import { createScenarios, percentile } from './scenarios';

const DOCS = [
  'perf/perf-flat-200.graphml',
  'perf/perf-medium-depth3.graphml',
  'perf/perf-deep-depth6.graphml',
  'perf/perf-large-depth4.graphml',
].filter((doc) => matchesFilter(process.env.PERF_DOCS, doc));

const WARMUP_STEPS = 10;
const STEPS = 60;
const FRAME_BUDGET_MS = 16.7;
// Для этих сценариев снимаем CPU-профиль (у остальных он почти такой же)
const PROFILED_SCENARIOS = ['frame', 'hover', 'drag-nested', 'frame-fit', 'drag-nested-fit'];

function matchesFilter(filter: string | undefined, value: string) {
  if (!filter) return true;
  return filter.split(',').some((part) => value.includes(part.trim()));
}

const SCENARIO_NAMES = createScenarios()
  .map((scenario) => scenario.name)
  .filter((name) => matchesFilter(process.env.PERF_SCENARIOS, name));

/**
 * Свежий документ и свежий экземпляр сценария (у сценариев есть внутреннее состояние).
 * Возвращает шаг "ввод + кадр, если он грязный" - ровно как цикл рендера в CanvasEditor.
 */
async function prepare(docPath: string, name: string) {
  const doc = await loadDocument(readDemo(docPath));
  const scenario = createScenarios().find((s) => s.name === name)!;
  const renderIfDirty = () => {
    if (doc.editor.view.isDirty) doc.drawFrame();
  };
  const teardown = scenario.setup(doc.editor);
  renderIfDirty();
  return {
    step: (i: number) => {
      scenario.step(doc.editor, i);
      renderIfDirty();
    },
    teardown: () => teardown?.(),
  };
}

type Counters = Record<string, number>;

/** Подменяет геттеры/методы Shape обёртками-счётчиками, возвращает функцию отката */
async function instrumentShape(counters: Counters) {
  const { Shape } = await import('@renderer/lib/drawable/Shape');
  const proto = Shape.prototype as unknown as Record<string, unknown>;
  const restore: (() => void)[] = [];

  for (const name of [
    'compoundPosition',
    'computedPosition',
    'computedWidth',
    'childrenContainerHeight',
    'drawBounds',
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name)!;
    const get = descriptor.get!;
    Object.defineProperty(proto, name, {
      ...descriptor,
      get() {
        counters[name] = (counters[name] ?? 0) + 1;
        return get.call(this);
      },
    });
    restore.push(() => Object.defineProperty(proto, name, descriptor));
  }

  for (const name of ['getIntersection', 'isUnderMouse']) {
    const original = proto[name] as (...args: unknown[]) => unknown;
    proto[name] = function (this: unknown, ...args: unknown[]) {
      counters[name] = (counters[name] ?? 0) + 1;
      return original.apply(this, args);
    };
    restore.push(() => (proto[name] = original));
  }

  return () => restore.forEach((fn) => fn());
}

type CpuProfileNode = {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number };
  hitCount?: number;
};

function post<T>(session: Session, method: string, params?: object) {
  return new Promise<T>((done, fail) =>
    session.post(method, params ?? {}, (error, result) => (error ? fail(error) : done(result as T)))
  );
}

/** Топ функций по собственному времени (self time) за время выполнения fn */
async function profile(fn: () => void, top = 8) {
  const session = new Session();
  session.connect();
  await post(session, 'Profiler.enable');
  await post(session, 'Profiler.setSamplingInterval', { interval: 100 });
  await post(session, 'Profiler.start');
  fn();
  const { profile } = await post<{ profile: { nodes: CpuProfileNode[] } }>(
    session,
    'Profiler.stop'
  );
  session.disconnect();

  const byFunction = new Map<string, number>();
  let total = 0;
  for (const node of profile.nodes) {
    const hits = node.hitCount ?? 0;
    total += hits;
    const { functionName, url, lineNumber } = node.callFrame;
    const file = url.replace(/^.*\/src\/renderer\/src\//, '').replace(/^.*node_modules\//, 'nm:');
    const key = `${functionName || '(anonymous)'} ${file ? `${file}:${lineNumber + 1}` : ''}`;
    byFunction.set(key, (byFunction.get(key) ?? 0) + hits);
  }

  return [...byFunction.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, hits]) => ({ name, percent: Math.round((hits / total) * 1000) / 10 }));
}

type Result = {
  doc: string;
  scenario: string;
  p50: number;
  p95: number;
  max: number;
  overBudget: number;
  perStep: Counters;
  profile?: { name: string; percent: number }[];
};

async function runScenario(docPath: string, name: string): Promise<Result> {
  const fmt = (v: number) => Math.round(v * 100) / 100;

  // Замер времени
  let run = await prepare(docPath, name);
  for (let i = 0; i < WARMUP_STEPS; i++) run.step(i);
  const times: number[] = [];
  for (let i = 0; i < STEPS; i++) {
    const start = performance.now();
    run.step(WARMUP_STEPS + i);
    times.push(performance.now() - start);
  }
  run.teardown();
  times.sort((a, b) => a - b);

  // Профиль (отдельным проходом на свежем документе)
  let cpu: Result['profile'];
  if (process.env.PERF_PROFILE !== '0' && PROFILED_SCENARIOS.includes(name)) {
    run = await prepare(docPath, name);
    const profiled = run;
    cpu = await profile(() => {
      for (let i = 0; i < 30; i++) profiled.step(i);
    });
    run.teardown();
  }

  // Счётчики вызовов (обёртки замедляют код, поэтому отдельным проходом)
  run = await prepare(docPath, name);
  const counters: Counters = {};
  const COUNT_STEPS = 10;
  const restore = await instrumentShape(counters);
  resetContextCallCount();
  try {
    for (let i = 0; i < COUNT_STEPS; i++) run.step(i);
  } finally {
    restore();
  }
  counters.ctxCalls = getContextCallCount();
  counters.getColor = getComputedStyleCount();
  run.teardown();

  const perStep: Counters = {};
  for (const [key, value] of Object.entries(counters)) {
    perStep[key] = Math.round(value / COUNT_STEPS);
  }

  return {
    doc: docPath.replace('perf/', '').replace('.graphml', ''),
    scenario: name,
    p50: fmt(percentile(times, 50)),
    p95: fmt(percentile(times, 95)),
    max: fmt(times[times.length - 1]),
    overBudget: times.filter((t) => t > FRAME_BUDGET_MS).length,
    perStep,
    profile: cpu,
  };
}

test(
  'canvas perf',
  async () => {
    const results: Result[] = [];

    for (const docPath of DOCS) {
      for (const name of SCENARIO_NAMES) {
        const result = await runScenario(docPath, name);
        results.push(result);
        console.log(
          `${result.doc.padEnd(20)} ${result.scenario.padEnd(20)} ` +
            `p50 ${String(result.p50).padStart(8)} ms  p95 ${String(result.p95).padStart(8)} ms  ` +
            `max ${String(result.max).padStart(8)} ms  >16мс ${result.overBudget}/${STEPS}`
        );
      }
    }

    const lines = [
      '',
      `Время шага сценария (обработчик + кадр), мс; бюджет кадра ${FRAME_BUDGET_MS} мс`,
      '',
      '| Документ | Сценарий | p50 | p95 | max | >16мс | computedWidth/шаг | childrenContainerHeight/шаг | getIntersection/шаг | getColor/шаг | ctx/шаг |',
      '|---|---|---|---|---|---|---|---|---|---|---|',
      ...results.map(
        (r) =>
          `| ${r.doc} | ${r.scenario} | ${r.p50} | ${r.p95} | ${r.max} | ${r.overBudget}/${STEPS} | ` +
          `${r.perStep.computedWidth ?? 0} | ${r.perStep.childrenContainerHeight ?? 0} | ` +
          `${r.perStep.getIntersection ?? 0} | ${r.perStep.getColor ?? 0} | ${
            r.perStep.ctxCalls ?? 0
          } |`
      ),
      '',
    ];

    const profiled = results.filter((r) => r.profile);
    for (const r of profiled) {
      lines.push(`Профиль ${r.doc} / ${r.scenario} (self time):`);
      for (const item of r.profile!)
        lines.push(`  ${String(item.percent).padStart(5)}%  ${item.name}`);
      lines.push('');
    }

    const report = lines.join('\n');
    console.log(report);

    const outDir = resolve(__dirname, '../../../../../perf-results');
    mkdirSync(outDir, { recursive: true });
    const payload = JSON.stringify(
      { date: new Date().toISOString(), node: process.version, steps: STEPS, results },
      null,
      2
    );
    writeFileSync(join(outDir, 'bench-latest.json'), payload);
    writeFileSync(join(outDir, 'bench-latest.md'), report);
  },
  60 * 60 * 1000
);
