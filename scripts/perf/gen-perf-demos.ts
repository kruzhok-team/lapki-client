/**
 * Генератор синтетических схем для замеров производительности холста.
 *
 * Запуск: npm run perf:gen
 * Результат: demos/perf/*.graphml
 *
 * Генерация детерминированная (фиксированный seed), поэтому файлы можно
 * перегенерировать в любой момент и получить ровно то же самое.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

type Preset = {
  file: string;
  title: string;
  seed: number;
  roots: number;
  // Сколько детей у составного состояния на каждом уровне (индекс = глубина родителя)
  branching: number[];
  // Сколько переходов приходится на одно состояние
  transitionsPerState: number;
};

const PRESETS: Preset[] = [
  {
    file: 'perf-flat-200.graphml',
    title: 'Perf: плоская, 200 состояний',
    seed: 1,
    roots: 200,
    branching: [],
    transitionsPerState: 1.5,
  },
  {
    file: 'perf-medium-depth3.graphml',
    title: 'Perf: средняя, глубина 3',
    seed: 2,
    roots: 8,
    branching: [3, 3],
    transitionsPerState: 1.5,
  },
  {
    file: 'perf-deep-depth6.graphml',
    title: 'Perf: глубокая, глубина 6',
    seed: 3,
    roots: 1,
    branching: [2, 2, 2, 2, 2],
    transitionsPerState: 1.5,
  },
  {
    file: 'perf-large-depth4.graphml',
    title: 'Perf: большая, глубина 4',
    seed: 4,
    roots: 8,
    branching: [3, 3, 3],
    transitionsPerState: 1.5,
  },
];

const LEAF_WIDTH = 450;
const STATE_HEIGHT = 95;
const GAP = 80;
const CHILDREN_OFFSET_Y = STATE_HEIGHT + 30;
const CHILDREN_OFFSET_X = 30;

// mulberry32
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = {
  id: string;
  name: string;
  depth: number;
  children: Node[];
  // Позиция относительно родителя
  x: number;
  y: number;
  width: number;
  // Полный размер вместе с детьми, нужен только для раскладки
  boxWidth: number;
  boxHeight: number;
};

function buildTree(preset: Preset) {
  const all: Node[] = [];
  let counter = 0;

  const make = (depth: number, parentId?: string): Node => {
    const id = parentId ? `${parentId}::s${counter++}` : `s${counter++}`;
    const node: Node = {
      id,
      name: `Состояние ${counter}`,
      depth,
      children: [],
      x: 0,
      y: 0,
      width: LEAF_WIDTH,
      boxWidth: LEAF_WIDTH,
      boxHeight: STATE_HEIGHT,
    };
    all.push(node);

    const count = preset.branching[depth] ?? 0;
    for (let i = 0; i < count; i++) {
      node.children.push(make(depth + 1, id));
    }

    return node;
  };

  const roots: Node[] = [];
  for (let i = 0; i < preset.roots; i++) {
    roots.push(make(0));
  }

  return { roots, all };
}

// Раскладка сеткой: размер ячейки = максимальный размер ребёнка
function layoutGrid(nodes: Node[], originX: number, originY: number) {
  if (nodes.length === 0) return { width: 0, height: 0 };

  nodes.forEach(layoutNode);

  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const cellWidth = Math.max(...nodes.map((n) => n.boxWidth)) + GAP;
  const cellHeight = Math.max(...nodes.map((n) => n.boxHeight)) + GAP;

  nodes.forEach((node, i) => {
    node.x = originX + (i % cols) * cellWidth;
    node.y = originY + Math.floor(i / cols) * cellHeight;
  });

  return { width: cols * cellWidth - GAP, height: rows * cellHeight - GAP };
}

function layoutNode(node: Node) {
  if (node.children.length === 0) return;

  const inner = layoutGrid(node.children, CHILDREN_OFFSET_X, CHILDREN_OFFSET_Y);
  node.width = Math.max(LEAF_WIDTH, inner.width + CHILDREN_OFFSET_X * 2);
  node.boxWidth = node.width;
  node.boxHeight = CHILDREN_OFFSET_Y + inner.height + 30;
}

function buildTransitions(preset: Preset, all: Node[], random: () => number) {
  const target = Math.round(all.length * preset.transitionsPerState);
  const transitions: [Node, Node][] = [];

  // Сначала цепочки между соседями одного родителя - так выглядят реальные схемы
  const byParent = new Map<string, Node[]>();
  for (const node of all) {
    const parent = node.id.includes('::') ? node.id.slice(0, node.id.lastIndexOf('::')) : '';
    byParent.set(parent, [...(byParent.get(parent) ?? []), node]);
  }
  for (const siblings of byParent.values()) {
    for (let i = 0; i + 1 < siblings.length && transitions.length < target; i++) {
      transitions.push([siblings[i], siblings[i + 1]]);
    }
  }

  // Остальное - случайные переходы, в том числе между уровнями вложенности
  while (transitions.length < target) {
    const source = all[Math.floor(random() * all.length)];
    const targetNode = all[Math.floor(random() * all.length)];
    if (source === targetNode) continue;
    transitions.push([source, targetNode]);
  }

  return transitions;
}

function absolutePosition(node: Node, index: Map<string, Node>) {
  let x = node.x;
  let y = node.y;
  let id = node.id;
  while (id.includes('::')) {
    id = id.slice(0, id.lastIndexOf('::'));
    const parent = index.get(id)!;
    x += parent.x;
    y += parent.y;
  }
  return { x, y };
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderState(node: Node, indent: string): string {
  const children = node.children.map((child) => renderState(child, indent + '    ')).join('');
  const graph = children
    ? `${indent}  <graph id="${node.id}">\n${children}${indent}  </graph>\n`
    : '';

  return (
    `${indent}<node id="${node.id}">\n` +
    `${indent}  <data key="dName">${escapeXml(node.name)}</data>\n` +
    `${indent}  <data key="dData">entry/\nLED1.on()\nTimer1.start(1000)\n\n</data>\n` +
    `${indent}  <data key="dGeometry">\n` +
    `${indent}    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${STATE_HEIGHT}"></rect>\n` +
    `${indent}  </data>\n` +
    graph +
    `${indent}</node>\n`
  );
}

function generate(preset: Preset) {
  const random = createRandom(preset.seed);
  const { roots, all } = buildTree(preset);
  layoutGrid(roots, 0, 0);

  const index = new Map(all.map((node) => [node.id, node]));
  const transitions = buildTransitions(preset, all, random);

  const edges = transitions
    .map(([source, target], i) => {
      const s = absolutePosition(source, index);
      const t = absolutePosition(target, index);
      const label = {
        x: Math.round((s.x + t.x) / 2 + LEAF_WIDTH / 2),
        y: Math.round((s.y + t.y) / 2 + STATE_HEIGHT / 2),
      };
      return (
        `    <edge id="e${i}" source="${source.id}" target="${target.id}">\n` +
        `      <data key="dData">Timer1.timeout/\nLED1.toggle()\n\n</data>\n` +
        `      <data key="dLabelGeometry">\n` +
        `        <point x="${label.x}" y="${label.y}"></point>\n` +
        `      </data>\n` +
        `    </edge>\n`
      );
    })
    .join('');

  const first = absolutePosition(roots[0], index);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n` +
    `  <data key="gFormat">Cyberiada-GraphML-1.0</data>\n` +
    `  <key attr.name="name" attr.type="string" for="node" id="dName"></key>\n` +
    `  <key attr.name="data" attr.type="string" for="node" id="dData"></key>\n` +
    `  <key attr.name="data" attr.type="string" for="edge" id="dData"></key>\n` +
    `  <key attr.name="initial" attr.type="string" for="node" id="dInitial"></key>\n` +
    `  <key for="edge" id="dGeometry"></key>\n` +
    `  <key for="node" id="dGeometry"></key>\n` +
    `  <key for="edge" id="dLabelGeometry"></key>\n` +
    `  <key for="node" id="dVertex"></key>\n` +
    `  <key for="node" id="dNote"></key>\n` +
    `  <graph id="G">\n` +
    `    <data key="dStateMachine"></data>\n` +
    `    <node id="coreMeta">\n` +
    `      <data key="dNote">formal</data>\n` +
    `      <data key="dName">CGML_META</data>\n` +
    `      <data key="dData">platform/ ArduinoUno\n\nstandardVersion/ 1.0\n\nname/ ${escapeXml(
      preset.title
    )}\n\nplatformVersion/ 1.0\n\n</data>\n` +
    `    </node>\n` +
    `    <node id="cLED1">\n` +
    `      <data key="dNote">formal</data>\n` +
    `      <data key="dName">CGML_COMPONENT</data>\n` +
    `      <data key="dData">id/ LED1\n\ntype/ LED\n\npin/ 12\n\n</data>\n` +
    `    </node>\n` +
    `    <node id="cTimer1">\n` +
    `      <data key="dNote">formal</data>\n` +
    `      <data key="dName">CGML_COMPONENT</data>\n` +
    `      <data key="dData">id/ Timer1\n\ntype/ Timer\n\n</data>\n` +
    `    </node>\n` +
    roots.map((root) => renderState(root, '    ')).join('') +
    `    <node id="init">\n` +
    `      <data key="dVertex">initial</data>\n` +
    `      <data key="dGeometry">\n` +
    `        <point x="${first.x - 60}" y="${first.y - 60}"></point>\n` +
    `      </data>\n` +
    `    </node>\n` +
    `    <edge id="init-edge" source="init" target="${roots[0].id}"></edge>\n` +
    edges +
    `  </graph>\n` +
    `</graphml>\n`;

  return { xml, states: all.length, transitions: transitions.length };
}

const outDir = resolve(__dirname, '../../demos/perf');
mkdirSync(outDir, { recursive: true });

for (const preset of PRESETS) {
  const { xml, states, transitions } = generate(preset);
  writeFileSync(join(outDir, preset.file), xml);
  const depth = preset.branching.length + 1;
  console.log(`${preset.file}: ${states} состояний, ${transitions} переходов, глубина ${depth}`);
}
