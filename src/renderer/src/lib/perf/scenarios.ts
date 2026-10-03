/**
 * Сценарии замеров холста. Общие для бенчмарка (npm run perf:bench) и прогона
 * в приложении (window.__perf.run()).
 *
 * Шаг сценария только подаёт ввод через те же обработчики, что и реальная мышь
 * (EditorView.handleMouse*), и помечает кадр "грязным". Рисует вызывающая сторона:
 * в бенчмарке - сразу после шага, в приложении - настоящий цикл рендера.
 */
import type { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { MAX_SCALE, MIN_SCALE } from '@renderer/lib/constants';
import type { Shape, State } from '@renderer/lib/drawable';
import type { MyMouseEvent } from '@renderer/lib/types/mouse';

export type Scenario = {
  name: string;
  description: string;
  /** Подготовка; может вернуть функцию завершения (например, отпустить кнопку мыши) */
  setup: (editor: CanvasEditor) => void | (() => void);
  step: (editor: CanvasEditor, i: number) => void;
};

function mouseEvent(x: number, y: number, extra: Partial<MyMouseEvent> = {}): MyMouseEvent {
  return {
    x,
    y,
    dx: 0,
    dy: 0,
    left: false,
    right: false,
    button: 0,
    stopPropagation: () => undefined,
    nativeEvent: {} as MouseEvent,
    ...extra,
  };
}

/** Камера как при открытии схемы: масштаб 1, видна часть схемы */
function resetCamera(editor: CanvasEditor) {
  editor.view.viewCentering();
}

/** Камера "вся схема в кадре" (или максимальное отдаление, если схема не помещается и при нём) */
function fitCamera(editor: CanvasEditor) {
  const { view, controller } = editor;

  // При масштабе 1 и нулевом смещении экранные координаты совпадают с мировыми
  view.setScale(1);
  controller.offset = { x: 0, y: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  view.children.forEach((child) => {
    if (!('drawBounds' in child)) return;
    const b = (child as Shape).drawBounds;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + (b.childrenHeight || b.height));
  });

  const { width, height } = editor.canvas;
  const fit = Math.max((maxX - minX) / width, (maxY - minY) / height) * 1.05;
  const scale = Number(Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit)).toFixed(2));
  view.setScale(scale);
  // window = (world + offset) / scale  =>  offset = window * scale - world
  controller.offset = {
    x: (width / 2) * scale - (minX + maxX) / 2,
    y: (height / 2) * scale - (minY + maxY) / 2,
  };
  view.isDirty = true;
}

function getStates(editor: CanvasEditor) {
  return [...editor.controller.states.data.states.values()] as State[];
}

/** Состояния от самого глубоко вложенного к корневым */
function rankDeepest(editor: CanvasEditor) {
  return getStates(editor).sort((a, b) => b.getDepth() - a.getDepth());
}

/** Корневые состояния от самого большого поддерева к самому маленькому */
function rankBiggestRoots(editor: CanvasEditor) {
  const sizes = new Map<State, number>();
  for (const state of getStates(editor)) {
    let root = state;
    while (root.parent) root = root.parent as State;
    sizes.set(root, (sizes.get(root) ?? 0) + 1);
  }
  return [...sizes.entries()].sort((a, b) => b[1] - a[1]).map(([root]) => root);
}

/**
 * Точка на экране, нажав в которую мы возьмём именно это состояние.
 * Поверх состояния могут лежать метки переходов и вложенные состояния, а где именно -
 * зависит от размера холста и масштаба. Поэтому перебираем сетку точек по телу состояния
 * (сверху вниз, слева направо) и проверяем hit-test.
 */
function findGrabPoint(editor: CanvasEditor, state: State) {
  const b = state.drawBounds;
  const { width, height } = editor.canvas;
  const STEPS = 6;

  // Сначала угол заголовка (как нажал бы человек), потом сетка по телу состояния
  const candidates = [{ x: b.x + Math.min(15, b.width / 3), y: b.y + Math.min(10, b.height / 3) }];
  for (let iy = 0; iy < STEPS; iy++) {
    for (let ix = 0; ix < STEPS; ix++) {
      candidates.push({
        x: b.x + (b.width * (ix + 0.5)) / STEPS,
        y: b.y + (b.height * (iy + 0.5)) / STEPS,
      });
    }
  }

  return (
    candidates.find(
      (point) =>
        point.x >= 0 &&
        point.y >= 0 &&
        point.x <= width &&
        point.y <= height &&
        editor.view.getCapturedNode({ position: point }) === state
    ) ?? null
  );
}

/** Ставит камеру так, чтобы состояние было в центре экрана */
function focusOn(editor: CanvasEditor, state: State) {
  const controller = editor.controller;
  const scale = controller.scale;
  const world = state.compoundPosition;
  // window = (world + offset) / scale  =>  offset = window * scale - world
  controller.offset = {
    x: (editor.canvas.width / 2) * scale - world.x,
    y: (editor.canvas.height / 2) * scale - world.y,
  };
  editor.view.isDirty = true;
}

// Простой детерминированный ГПСЧ, чтобы прогоны были одинаковыми
function createRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/** Направление движения на шаге i: туда-обратно, чтобы за 40 шагов вернуться в исходную точку */
const direction = (i: number) => (i % 40 < 20 ? 1 : -1);

function createDragScenario(
  name: string,
  description: string,
  rankTargets: (editor: CanvasEditor) => State[],
  camera: 'focus' | 'fit'
): Scenario {
  let cursor = { x: 0, y: 0 };

  return {
    name,
    description,
    setup: (editor) => {
      if (camera === 'fit') fitCamera(editor);

      // Берём первое по списку состояние, за которое реально можно взяться мышью
      let target: State | null = null;
      for (const candidate of rankTargets(editor)) {
        if (camera === 'focus') {
          resetCamera(editor);
          focusOn(editor, candidate);
        }
        const point = findGrabPoint(editor, candidate);
        if (point) {
          target = candidate;
          cursor = point;
          break;
        }
      }
      if (!target) throw new Error(`${name}: не нашлось состояния, за которое можно взяться`);

      editor.view.handleMouseDown(mouseEvent(cursor.x, cursor.y, { left: true }));

      const captured = (editor.view as unknown as { mouseDownNode: State | null }).mouseDownNode;
      if (captured?.id !== target.id) {
        throw new Error(`Захватилось ${captured?.id ?? 'ничего'} вместо ${target.id}`);
      }

      return () => editor.view.handleMouseUp(mouseEvent(cursor.x, cursor.y, { left: true }));
    },
    step: (editor, i) => {
      const dx = 3 * direction(i);
      const dy = direction(i);
      cursor = { x: cursor.x + dx, y: cursor.y + dy };
      editor.view.handleMouseMove(mouseEvent(cursor.x, cursor.y, { dx, dy, left: true }));
    },
  };
}

export function createScenarios(): Scenario[] {
  const random = createRandom(42);

  return [
    {
      name: 'frame',
      description: 'Полная перерисовка кадра без изменений',
      setup: resetCamera,
      step: (editor) => {
        editor.view.isDirty = true;
      },
    },
    {
      name: 'pan',
      description: 'Панорамирование правой кнопкой',
      setup: resetCamera,
      step: (editor, i) => {
        const dx = 5 * direction(i);
        editor.view.handleMouseMove(mouseEvent(500, 500, { dx, dy: 0, right: true }));
      },
    },
    {
      name: 'zoom',
      description: 'Зум (смена масштаба + перерисовка)',
      setup: resetCamera,
      step: (editor, i) => {
        const scale = 1 + 0.5 * Math.sin(i / 5);
        editor.view.setScale(Number(scale.toFixed(2)));
      },
    },
    {
      name: 'hover',
      description: 'Движение мыши без кнопок (хит-тест под курсором)',
      setup: resetCamera,
      step: (editor) => {
        const x = random() * editor.canvas.width;
        const y = random() * editor.canvas.height;
        editor.view.handleMouseMove(mouseEvent(x, y, { dx: 1, dy: 1 }));
      },
    },
    createDragScenario(
      'drag-nested',
      'Перетаскивание самого глубоко вложенного состояния',
      rankDeepest,
      'focus'
    ),
    createDragScenario(
      'drag-parent',
      'Перетаскивание корневого состояния с самым большим поддеревом',
      rankBiggestRoots,
      'focus'
    ),

    // То же при отдалении, когда видна вся схема
    {
      name: 'frame-fit',
      description: 'Полная перерисовка кадра, видна вся схема',
      setup: fitCamera,
      step: (editor) => {
        editor.view.isDirty = true;
      },
    },
    {
      name: 'pan-fit',
      description: 'Панорамирование, видна вся схема',
      setup: fitCamera,
      step: (editor, i) => {
        const dx = 5 * direction(i);
        editor.view.handleMouseMove(mouseEvent(500, 500, { dx, dy: 0, right: true }));
      },
    },
    createDragScenario(
      'drag-nested-fit',
      'Перетаскивание самого глубоко вложенного состояния, видна вся схема',
      rankDeepest,
      'fit'
    ),
    createDragScenario(
      'drag-parent-fit',
      'Перетаскивание корневого состояния с самым большим поддеревом, видна вся схема',
      rankBiggestRoots,
      'fit'
    ),
  ];
}

export function percentile(sorted: number[], p: number) {
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}
