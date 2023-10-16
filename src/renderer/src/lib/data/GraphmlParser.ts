import { Data } from 'electron';
import { XMLParser } from 'fast-xml-parser';

import {
  State,
  Transition,
  Component,
  Action,
  Event,
  InnerElements,
  emptyElements,
  EventData,
  ArgList,
  Elements,
  Condition,
} from '@renderer/types/diagram';
import { ArgumentProto, Platform } from '@renderer/types/platform';

import { getAvailablePlatforms, getPlatform, isPlatformAvailable } from './PlatformLoader';

type Node = {
  id: string;
  data?: Array<DataNode>;
  graph?: Array<Graph>;
};

type Edge = {
  source: string;
  target: string;
  data?: Array<DataNode>;
};

type Graph = {
  node: Array<Node>;
  edge: Array<Edge>;
  edgedefault: string;
  id?: string;
};

type KeyProperties = {
  attrName?: string;
  attrType?: string;
};

type Meta = {
  format: string;
  platform: string;
  name?: string;
  author?: string;
  contact?: string;
  description?: string;
  unit?: string;
};

type DataNode = {
  key: string;
  content: string;
};

type KeyNode = {
  id: string;
  for: string;
  properties: KeyProperties;
};

// Набор функций, обрабатывающих data-узлы в зависимости от их ключа.
const dataNodeProcess = new Map<
  string,
  (
    elements: Elements,
    meta: Meta,
    node: DataNode,
    parentNode?: Node,
    state?: State,
    transition?: Transition
  ) => void // Вынести в отдельный интерфейс?
>([
  [
    'gFormat',
    (_elements: Elements, meta: Meta, node: DataNode, parentNode?: Node) => {
      console.log(node);
      meta.format = (node as DataNode).content; // TODO: Проверить, если уже был указан формат
    },
  ],
  [
    'dData',
    (
      elements: Elements,
      meta: Meta,
      node: DataNode,
      parentNode?: Node,
      state?: State,
      transition?: Transition
    ) => {
      if (parentNode !== undefined) {
        // Если это мета-компонент, то извлекаем мета-информацию
        if (parentNode.id == '') {
          parseMeta(meta, node.content);
        } else {
          if (state !== undefined) {
            parseNodeData(node.content, meta, state);
          }
        }
      } else {
        if (transition !== undefined) {
          parseTransitionData(node.content, transition);
          elements.transitions.push(transition);
        }
      }
    },
  ],
  [
    'dName',
    (_elements: Elements, meta: Meta, node: DataNode, parentNode?: Node, state?: State) => {
      if (parentNode !== undefined) {
        // В мета-состоянии dName означает название платформы
        if (parentNode.id == '') {
          if (meta.platform == '') {
            meta.platform = node.content;
          } else {
            console.log(
              `Повторное указание платформы! Старое значение: ${meta.platform}. Новое значение: ${node.content}`
            ); //TODO Модалкой
          }
        } else {
          if (state != undefined) {
            state.name = node.content;
          }
        }
      } else {
        console.log('Непредвиденный вызов функции dName');
      }
    },
  ],
  [
    'dInitial',
    (elements: Elements, meta: Meta, node: DataNode, parentNode?: Node) => {
      if (parentNode !== undefined) {
        elements.initialState = parentNode?.id;
      } else {
        console.log('Непредвиденный вызов функции dInitial');
      }
    },
  ],
  [
    'dGeometry',
    (elements: Elements, meta: Meta, node: DataNode, parentNode?: Node, state?: State) => {
      if (state !== undefined) {
        const x = node['x'];
        const y = node['y'];
        if (x == undefined || y == undefined) {
          console.log('Не указаны x или y для узла data с ключом dGeometry');
          return;
        } else {
          state.bounds = {
            x: node['x'] / 10,
            y: node['y'] / 10,
            width: node['width'] ? node['width'] : 0,
            height: node['height'] ? node['height'] : 0,
          };
        }
      } else {
        console.log('Непредвиденный вызов функции dGeometry');
      }
    },
  ],
]);

const randomColor = (): string => {
  let result = '';
  for (let i = 0; i < 6; ++i) {
    const value = Math.floor(16 * Math.random());
    result += value.toString(16);
  }
  return '#' + result;
};

// export const operatorSet = new Set([
//   'notEquals',
//   'equals',
//   'greater',
//   'less',
//   'greaterOrEqual',
//   'lessOrEqual',
// ]);

const operatorAlias = new Map<string, string>([
  ['==', 'equals'],
  ['!=', 'notEquals'],
  ['>', 'greater'],
  ['<', 'less'],
  ['>=', 'greaterOfEqual'],
  ['lessOrEqual', '<='],
]);

function checkConditionTokenType(token: string): Condition {
  if (token.includes('.')) {
    const [component, method] = token.split('.');

    return {
      type: 'component',
      value: {
        component: component,
        method: method,
        args: {},
      },
    };
  }

  return {
    type: 'value',
    value: token,
  };
}

function parseCondition(condition: string): Condition | undefined {
  const tokens = condition.split(' ');
  const lval = checkConditionTokenType(tokens[0]);
  const operator = operatorAlias.get(tokens[1]);
  const rval = checkConditionTokenType(tokens[2]);

  if (operator !== undefined) {
    return {
      type: operator,
      value: [lval, rval],
    };
  }

  console.log(`Неизвестный оператор ${operator}`);

  return;
}

// Функция извлекает события и действия из дата-ноды
function parseNodeData(content: string, meta: Meta, state: State) {
  // По формату CyberiadaGraphML события разделены пустой строкой.
  const unprocessedEventsAndActions = content.split('\n\n');

  for (const event of unprocessedEventsAndActions) {
    const result = parseEvent(event);
    if (result !== undefined) {
      state.events.push(result[0]);
    }
  }
}

function parseEvent(event: string): [EventData, Condition?] | undefined {
  if (event.includes('/')) {
    const eventAndAction = event.split('/'); // заменить на [event, action]
    let trigger = eventAndAction[0].trim();
    let condition: Condition | undefined;
    const actions = parseActions(eventAndAction[1].trim());

    if (trigger !== undefined) {
      if (trigger.includes('[')) {
        const event = trigger.split('[');
        trigger = event[0];
        condition = parseCondition(event[1].replace(']', ''));
        console.log(condition);
      }
      let ev = systemComponentAlias.get(trigger); // Подстановка exit/entry на System.onExit/System.onEnter

      if (ev == undefined) {
        const [component, method] = trigger.split('.');
        ev = {
          component: component,
          method: method,
        };
      }
      return [
        {
          trigger: ev,
          do: actions !== undefined ? actions : [],
        },
        condition,
      ];
    }
  } else {
    console.log(`Не определен триггер для действий ${event}`);
    return;
  }

  return;
}

function parseTransitionData(content: string, transition: Transition) {
  const unprocessedEventsAndActions = content.split('\n\n');
  // TODO: сделать проверку, что триггер всего один.
  for (const event of unprocessedEventsAndActions) {
    console.log(event);
    const result = parseEvent(event);
    if (result !== undefined) {
      const eventData = result[0];
      const condition = result[1];
      console.log(eventData);
      if (eventData !== undefined) {
        transition.trigger = eventData.trigger;
        transition.do = eventData.do;

        if (condition !== undefined) {
          transition.condition = condition;
        }
      }
    }
  }
}

function getAllComponents(elements: Elements, meta: Meta) {
  if (platform !== undefined && meta.platform.startsWith('BearlogaDefend')) {
    for (const componentName of Object.keys(platform.components)) {
      const component = platform.components[componentName];
      elements.components[componentName] = {
        type: componentName,
        parameters: {},
      };
    }
  }
}

function parseAction(unproccessedAction: string): Action | undefined {
  const [component, action] = unproccessedAction.trim().split('.');
  const bracketPos = action.indexOf('(');
  const args = action
    .slice(bracketPos + 1, action.length - 1)
    .split(',')
    .filter((value) => value !== ''); // Фильтр нужен, чтобы отсеять пустое значение в случае отсутствия аргументов.
  const method = action.slice(0, bracketPos);

  const resultAction: Action = {
    component: component,
    method: method,
  };
  const argList: ArgList = {};
  // Если параметров у метода нет, то methodParameters будет равен undefined
  const methodParameters = platform?.components[component]?.methods[method]?.parameters;
  if (
    platform?.components[component] !== undefined &&
    platform?.components[component].methods[method] !== undefined
  ) {
    for (const index in methodParameters) {
      const parameter: ArgumentProto = methodParameters[index];
      console.log(args[index]);
      if (args[index] !== undefined && args[index] !== '') {
        argList[parameter.name] = args[index];
      } else {
        console.log(`У ${component}.${method} отсутствует параметр ${parameter.name}`); // TODO Модалка
        return;
      }
    }
    if (methodParameters == undefined) {
      console.log(args);
      if (args.length == 0) {
        resultAction.args = argList;
      } else {
        console.log(
          `Неправильное количество аргументов у функции ${method} компонента ${component}.\n Нужно: 0, получено: ${args.length}`
        );
        return;
      }
    } else {
      if (Object.keys(argList).length == Object.keys(methodParameters).length) {
        resultAction.args = argList;
      } else {
        console.log(
          `Неправильное количество аргументов у функции ${method} компонента ${component}.\n Нужно: ${
            Object.keys(methodParameters).length
          }, получено: ${args.length}`
        );
      }
    }
    return resultAction;
  } else {
    console.log(`Неизвестный метод ${method} у компонента ${component}`);
    return;
  }
}

function parseActions(unsplitedActions: string): Action[] | undefined {
  if (platform !== undefined && unsplitedActions != '') {
    // Считаем, что действия находятся на разных строках
    const actions = unsplitedActions.split('\n');
    const resultActions = new Array<Action>();
    for (const unproccessedAction of actions) {
      const resultAction = parseAction(unproccessedAction);
      if (resultAction !== undefined) {
        resultActions.push(resultAction);
      }
    }
    return resultActions;
  }
  return;
}

function processTransitions(elements: Elements, meta: Meta, edges: Edge[]) {
  let foundInitial = false;
  for (const edge of edges) {
    if (!foundInitial && edge.source == elements.initialState) {
      delete elements.states[edge.source];
      elements.initialState = edge.target;
      foundInitial = true;
    }
    const transition: Transition = {
      source: edge.source,
      target: edge.target,
      color: randomColor(),
      trigger: {
        component: '',
        method: '',
      },
      position: {
        x: 0,
        y: 0,
      },
    };
    console.log(edge);
    for (const dataNodeIndex in edge.data) {
      const dataNode: DataNode = edge.data[dataNodeIndex];
      const func = dataNodeProcess.get(dataNode.key);
      if (func) {
        func(elements, meta, dataNode, undefined, undefined, transition);
      }
    }
  }
}

// Функция, которая находит формат и присваивают его к Meta
function setFormatToMeta(elements: Elements, xml: any, meta: Meta) {
  for (const node of xml.graphml.data) {
    const dataNode: DataNode = node;
    const func: CallableFunction | undefined = dataNodeProcess.get(dataNode.key);
    if (func) {
      func(elements, meta, node);
    }
  }
}

// Функция получает на вход строку, в которой мета-информация разделена символами / и \n
function parseMeta(meta: Meta, unproccessedMeta: string) {
  const splitedMeta = unproccessedMeta.split('\n');

  let lastPropertyKey: string = '';

  for (const property of splitedMeta) {
    if (property.includes('/')) {
      const keyValuePair = property.split('/');
      const key = keyValuePair[0].trim();
      const value = keyValuePair[1].trim();
      meta[key] = value;
      lastPropertyKey = key;
    } else {
      if (lastPropertyKey) {
        meta[lastPropertyKey] += property;
      }
    }
  }

  if (meta.platform == 'BearlogaDefend') {
    meta.platform = `${meta.platform}-${meta.unit}`;
  }
  if (isPlatformAvailable(meta.platform)) {
    platform = getPlatform(meta.platform);
  } else {
    console.log(`Неизвестная платформа ${meta.platform}`);
  }
}

function createEmptyState(): State {
  return {
    name: '',
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    events: [],
  };
}

// Обработка нод
function processNode(
  elements: Elements,
  node: Node,
  meta: Meta,
  awailableDataProperties: Map<string, Map<string, KeyProperties>>,
  parent?: Node
): State {
  const state: State = createEmptyState();

  if (node.data !== undefined) {
    for (const dataNode of node.data) {
      console.log(awailableDataProperties);
      if (awailableDataProperties.get('node')?.has(dataNode.key)) {
        const func = dataNodeProcess.get(dataNode.key);
        if (func) {
          func(elements, meta, dataNode, node, state);
        }
      } else {
        console.log(`Неизвестный key "${dataNode.key}" для узла node!`);
      }
    }
  }

  if (parent !== undefined) {
    state.parent = parent.id;
  }

  if (node.graph !== undefined) {
    console.log(node.graph);
    processGraph(elements, node.graph, meta, awailableDataProperties, node);
  }

  return state;
}

function processGraph(
  elements: Elements,
  xml: any,
  meta: Meta,
  awailableDataProperties: Map<string, Map<string, KeyProperties>>,
  parent?: Node
): Map<string, State> {
  const graph: Graph = xml;
  console.log(graph);
  for (const node of graph.node) {
    elements.states[node.id] = processNode(elements, node, meta, awailableDataProperties, parent);
  }

  if (graph.edge) {
    processTransitions(elements, meta, graph.edge);
  }

  console.log(elements);

  return new Map<string, State>();
}

// Добавляет допустимые свойства у узлов
function addPropertiesFromKeyNode(
  xml: any,
  awailableDataProperties: Map<string, Map<string, KeyProperties>> // Map<Название целевой ноды, Map<id свойства, аттрибуты свойства>>
) {
  for (const node of xml.graphml.key) {
    const keyNode: KeyNode = {
      id: node.id,
      for: node.for,
      properties: {
        attrName: node['attr.name'],
        attrType: node['attr.type'],
      },
    };

    // Если у нас уже есть список свойств для целевой ноды, то добавляем в уже существующий Map,
    // иначе - создаем новый.
    if (awailableDataProperties.has(keyNode.for)) {
      const nodeProperties = awailableDataProperties.get(keyNode.for);

      // Если есть такое свойство - вывести ошибку, иначе - добавить!
      if (nodeProperties?.has(keyNode.id)) {
        console.log(`Дублирование свойства ${keyNode.id} для узла ${keyNode.for}!`);
      } else {
        nodeProperties?.set(keyNode.id, keyNode.properties);
      }
    } else {
      awailableDataProperties.set(
        keyNode.for,
        new Map<string, KeyProperties>([[keyNode.id, keyNode.properties]])
      );
    }
  }
}

let platform: Platform | undefined;

const systemComponentAlias = new Map<string, Event>([
  ['entry', { component: 'System', method: 'onEnter' }],
  ['exit', { component: 'System', method: 'onExit' }],
]);

export function importGraphml() {
  const parser = new XMLParser({
    textNodeName: 'content',
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (_name, _jpath, isLeafNode, isAttribute) => {
      return isLeafNode && !isAttribute;
    },
  });

  const meta: Meta = {
    format: '',
    platform: '',
  };
  const elements: Elements = {
    states: {},
    transitions: [],
    initialState: '',
    components: {},
    platform: '',
  };

  const awailableDataProperties = new Map<string, Map<string, KeyProperties>>();
  const expression = `<?xml version="1.0" encoding="UTF-8"?>
                <graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <data key="gFormat">Cyberiada-GraphML</data>

  <key id="dName" for="node" attr.name="name" attr.type="string"/>
  <key id="dData" for="edge" attr.name="data" attr.type="string"/>
  <key id="dData" for="node" attr.name="data" attr.type="string"/>
  <key id="dInitial" for="node" attr.name="initial" attr.type="string"/>
  <key id="dGeometry" for="edge"/>
  <key id="dGeometry" for="node"/>

  <graph id="G" edgedefault="directed">
    <node id="">
      <data key="dName">BearlogaDefend</data>
      <data key="dData">name/ Автобортник
  author/ Матросов В.М.
  contact/ matrosov@mail.ru
  description/ Пример описания схемы, 
  который может быть многострочным, потому что так удобнее
  unit/ Autoborder
      </data>
    </node>

    <node id="n0">
      <data key="dName">Бой</data>
      <data key="dData">entry/

      exit/
  </data>
      <data key="dGeometry" x="-578.005" y="438.187256"
            width="672.532166" height="802.962646" />
      <graph>
        <node id="n0::n1">
          <data key="dName">Сближение</data>
          <data key="dData">entry/
  МодульДвижения.ДвигатьсяКЦели()

  exit/
  </data>
          <data key="dGeometry" x="-525.738953" y="609.6686" 
                width="468" height="170" />    
        </node>
        <node id="n0::n2">
          <data key="dName">Атака</data>
          <data key="dData">entry/
  ОружиеЦелевое.АтаковатьЦель()

  exit/
  </data>
          <data key="dGeometry" x="-630.2711" y="206.705933" 
                width="468" height="170" />
        </node>
      </graph>
    </node>
    <node id="n3">
      <data key="dName">Скан</data>
      <data key="dData">entry/
  Сенсор.ПоискВрагаПоДистанции(мин)

  exit/
  Сенсор.ОстановкаПоиска()
  </data>
      <data key="dGeometry" x="-1582.03857" y="606.497559" 
            width="468" height="330" />      
    </node>
    <node id="init">
      <data key="dInitial"></data>
      <data key="dGeometry" x="-1482.03857" y="606.497559" 
            width="20" height="20" />      
    </node>
    
    <edge source="init" target="n3"> </edge>
    <edge source="n0" target="n3">
      <data key="dData">АнализаторЦели.ЦельУничтожена/ Сосать.хуй()
  </data>
    </edge>
    <edge source="n0" target="n3">
      <data key="dData">АнализаторЦели.ЦельПотеряна/
  </data>
    </edge>
    <edge source="n3" target="n0::n1">
      <data key="dData">Сенсор.ЦельПолучена/
  </data>
    </edge>
    <edge source="n0::n1" target="n0::n2">
        <data key="dData">ОружиеЦелевое.ЦельВошлаВЗонуАтаки/
  </data>
    </edge>
    <edge source="n0::n2" target="n0::n1">
        <data key="dData">ОружиеЦелевое.ЦельВышлаИзЗоныАтаки[Счетчик.ТекущееЗначениеСчетчика &gt;= 2]/
  </data>
    </edge>
  </graph>
</graphml>`;

  const xml = parser.parse(expression);

  setFormatToMeta(elements, xml, meta);
  addPropertiesFromKeyNode(xml, awailableDataProperties);
  switch (meta.format) {
    case 'Cyberiada-GraphML': {
      processGraph(elements, xml.graphml.graph, meta, awailableDataProperties);
      getAllComponents(elements, meta);
      break;
    }
    default: {
      // TODO сделать модалкой
      console.log(`ОШИБКА! НЕИЗВЕСТНЫЙ ФОРМАТ "${meta.format}"!`);
    }
  }
  delete elements.states[''];

  elements.platform = meta.platform;

  return elements;
}
