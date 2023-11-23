import { XMLParser, XMLBuilder } from 'fast-xml-parser';

import {
  State,
  Transition,
  Component,
  Action,
  Event,
  EventData,
  ArgList,
  Elements,
  Condition,
  emptyElements,
} from '@renderer/types/diagram';
import { ArgumentProto, Platform } from '@renderer/types/platform';

import { getPlatform, isPlatformAvailable } from './PlatformLoader';

type Node = {
  id: string;
  data?: Array<DataNode>;
  graph?: Array<Graph>;
};

type OuterComponent = {
  id: string;
  name: string;
  humanName?: string;
  type: string;
  parameters: {
    [key: string]: string;
  };
  description?: string;
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

interface DataNodeProcessArgs {
  elements: Elements;
  meta: Meta;
  node: DataNode;
  component?: OuterComponent;
  parentNode?: Node;
  state?: State;
  transition?: Transition;
}

// Набор функций, обрабатывающих data-узлы в зависимости от их ключа.
const dataNodeProcess = new Map<
  string,
  (data: DataNodeProcessArgs) => void // Вынести в отдельный интерфейс?
>([
  [
    'gFormat',
    ({ meta, node }) => {
      meta.format = (node as DataNode).content; // TODO: Проверить, если уже был указан формат
    },
  ],
  [
    'dData',
    ({ elements, state, parentNode, meta, node, component, transition }) => {
      if (parentNode !== undefined) {
        // Если это мета-компонент, то извлекаем мета-информацию
        if (parentNode.id == '') {
          parseMeta(meta, node.content);
        } else {
          if (component !== undefined) {
            parseComponentNode(node.content, component);
          } else if (state !== undefined) {
            parseNodeData(elements, node.content, meta, state);
          }
        }
      } else {
        if (transition !== undefined) {
          parseTransitionData(elements, node.content, transition);
          elements.transitions.push(transition);
        }
      }
    },
  ],
  [
    'dName',
    (data: DataNodeProcessArgs) => {
      if (data.parentNode !== undefined) {
        // В мета-состоянии dName означает название платформы
        if (data.parentNode.id == '') {
          if (data.meta.platform == '') {
            data.meta.platform = data.node.content;
          } else {
            throw new Error(
              `Повторное указание платформы! Старое значение: ${data.meta.platform}. Новое значение: ${data.node.content}`
            );
          }
        } else {
          if (data.component !== undefined) {
            data.component.name = data.node.content;
          } else if (data.state != undefined) {
            data.state.name = data.node.content;
          }
        }
      } else {
        throw new Error('Непредвиденный вызов функции dName');
      }
    },
  ],
  [
    'dInitial',
    (data: DataNodeProcessArgs) => {
      if (data.parentNode !== undefined) {
        if (data.elements.initialState !== null) {
          data.elements.initialState.target = data.parentNode?.id;
        }
      } else {
        throw new Error('Непредвиденный вызов функции dInitial');
      }
    },
  ],
  [
    'dGeometry',
    (data: DataNodeProcessArgs) => {
      if (data.state !== undefined) {
        const x = data.node['x'];
        const y = data.node['y'];
        if (x == undefined || y == undefined) {
          throw new Error('Не указаны x или y для узла data с ключом dGeometry');
        } else {
          data.state.bounds = {
            x: data.node['x'] / 2,
            y: data.node['y'] / 2,
            width: data.node['width'] ? data.node['width'] : 0,
            height: data.node['height'] ? data.node['height'] : 0,
          };
        }
      } else if (data.transition !== undefined) {
        const x = data.node['x'];
        const y = data.node['y'];
        if (x == undefined || y == undefined) {
          throw new Error('Не указаны x или y для узла data с ключом dGeometry');
        } else {
          data.transition.position = {
            x: data.node['x'] / 2,
            y: data.node['y'] / 2,
          };
        }
      } else {
        throw new Error('Непредвиденный вызов функции dGeometry');
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
  throw new Error(`Неизвестный оператор ${operator}`);
}

// Функция извлекает события и действия из дата-ноды
function parseNodeData(elements: Elements, content: string, meta: Meta, state: State) {
  // По формату CyberiadaGraphML события разделены пустой строкой.
  const unprocessedEventsAndActions = content.split('\n\n');
  for (const event of unprocessedEventsAndActions) {
    const result = parseEvent(elements, event);
    if (result !== undefined) {
      state.events.push(result[0]);
    }
  }
}

function parseComponentNode(content: string, component: OuterComponent) {
  const unprocessedParameters = content.split('\n');
  const checkType = (componentType): boolean => {
    if (platform !== undefined) {
      return platform.components[componentType] !== undefined;
    } else {
      throw new Error(`Платформа не определена!`);
    }
  };

  const checkParameter = (parameterName, componentType): boolean => {
    return platform?.components[componentType].parameters[parameterName] !== undefined;
  };

  for (const parameter of unprocessedParameters) {
    let [parameterName, value] = parameter.split('/');
    parameterName = parameterName.trim();
    value = value.trim();
    switch (parameterName) {
      case 'type': {
        if (component.type == '') {
          if (checkType(value)) component.type = value;
          else {
            throw new Error(`Неизвестный тип компонента ${value} в платформе ${platform?.name}`);
          }
        } else {
          throw new Error(
            `Тип компонента ${component.name} уже указан! Предыдущий тип ${component.type}, новый - ${value}`
          );
        }
        break;
      }
      case 'description': {
        if (component.description == undefined) {
          component.description = value;
        } else {
          throw new Error(
            `Описание компонента ${component.name} уже указано! Предыдущее описание ${component.description}, новое - ${value}`
          );
        }
        break;
      }
      case 'name': {
        if (component.humanName == undefined || component.humanName == '') {
          component.humanName = value;
        } else {
          throw new Error(
            `Имя компонента ${component.humanName} уже указано! Предыдущее имя ${component.humanName}, новое - ${value}`
          );
        }
        break;
      }
      default:
        if (checkParameter(parameterName, component.type)) {
          component.parameters[parameterName] = value;
        } else {
          throw new Error(
            `Неизвестный параметр ${parameterName} для компонента типа ${component.type}`
          );
        }
    }
  }
}

function parseEvent(elements: Elements, event: string): [EventData, Condition?] | undefined {
  if (event.includes('/')) {
    const eventAndAction = event.split('/'); // заменить на [event, action]
    let trigger = eventAndAction[0].trim();
    let condition: Condition | undefined;
    const actions = parseActions(elements, eventAndAction[1].trim());
    if (trigger !== undefined) {
      if (trigger.includes('[')) {
        const event = trigger.split('[');
        trigger = event[0];
        condition = parseCondition(event[1].replace(']', ''));
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
    throw new Error(`Не определен триггер для действий ${event}`);
  }

  return;
}

function parseTransitionData(elements: Elements, content: string, transition: Transition) {
  const unprocessedEventsAndActions = content.split('\n\n');
  // TODO: сделать проверку, что триггер всего один.
  for (const event of unprocessedEventsAndActions) {
    const result = parseEvent(elements, event);
    if (result !== undefined) {
      const eventData = result[0];
      const condition = result[1];
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
      elements.components[componentName] = {
        type: componentName,
        parameters: {},
      };
    }
  }
}

function parseAction(elements: Elements, unproccessedAction: string): Action | undefined {
  const [component_name, action] = unproccessedAction.trim().split('.');
  const bracketPos = action.indexOf('(');
  const args = action
    .slice(bracketPos + 1, action.length - 1)
    .split(',')
    .filter((value) => value !== ''); // Фильтр нужен, чтобы отсеять пустое значение в случае отсутствия аргументов.
  const method = action.slice(0, bracketPos);
  const resultAction: Action = {
    component: component_name,
    method: method,
  };

  const component = elements.components[component_name];
  const argList: ArgList = {};
  // Если параметров у метода нет, то methodParameters будет равен undefined
  if (component !== undefined) {
    const methodParameters = platform?.components[component.type]?.methods[method]?.parameters;
    if (
      platform?.components[component.type] !== undefined &&
      platform?.components[component.type].methods[method] !== undefined
    ) {
      for (const index in methodParameters) {
        const parameter: ArgumentProto = methodParameters[index];
        if (args[index] !== undefined && args[index] !== '') {
          argList[parameter.name] = args[index];
        } else {
          throw new Error(`У ${component_name}.${method} отсутствует параметр ${parameter.name}`); // TODO Модалка
        }
      }
      if (methodParameters == undefined) {
        if (args.length == 0) {
          resultAction.args = argList;
        } else {
          throw new Error(
            `Неправильное количество аргументов у функции ${method} компонента ${component_name}.\n Нужно: 0, получено: ${args.length}`
          );
        }
      } else {
        if (Object.keys(argList).length == Object.keys(methodParameters).length) {
          resultAction.args = argList;
        } else {
          throw new Error(
            `Неправильное количество аргументов у функции ${method} компонента ${component_name}.\n Нужно: ${
              Object.keys(methodParameters).length
            }, получено: ${args.length}`
          );
        }
      }
      return resultAction;
    } else {
      throw new Error(`Неизвестный метод ${method} у компонента ${component_name}`);
    }
  } else {
    throw new Error(`Неизвестный компонент ${component_name}`);
  }
}

function parseActions(elements: Elements, unsplitedActions: string): Action[] | undefined {
  if (platform !== undefined && unsplitedActions != '') {
    // Считаем, что действия находятся на разных строках
    const actions = unsplitedActions.split('\n');
    const resultActions = new Array<Action>();
    for (const unproccessedAction of actions) {
      const resultAction = parseAction(elements, unproccessedAction);
      if (resultAction !== undefined) {
        resultActions.push(resultAction);
      }
    }
    return resultActions;
  } else {
    console.log('Отсутствуют действия на событие');
  }
}

function processTransitions(elements: Elements, meta: Meta, edges: Edge[]) {
  let foundInitial = false;
  for (const idx in edges) {
    const edge = edges[idx];
    if (!foundInitial && edge.source == elements.initialState?.target) {
      delete elements.states[edge.source];
      elements.initialState.target = edge.target;
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
    for (const dataNodeIndex in edge.data) {
      const dataNode: DataNode = edge.data[dataNodeIndex];
      const func = dataNodeProcess.get(dataNode.key);
      if (func) {
        func({
          elements: elements,
          meta: meta,
          node: dataNode,
          component: undefined,
          parentNode: undefined,
          transition: transition,
        });
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
      func({ elements, meta, node });
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
    throw new Error(`Неизвестная платформа ${meta.platform}`);
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
  parent?: Node,
  component?: OuterComponent
): State {
  const state: State = createEmptyState();
  if (node.data !== undefined) {
    for (const dataNode of node.data) {
      if (awailableDataProperties.get('node')?.has(dataNode.key)) {
        const func = dataNodeProcess.get(dataNode.key);
        if (func) {
          func({
            elements: elements,
            meta: meta,
            node: dataNode,
            parentNode: node,
            state: state,
            component: component,
          });
        }
      } else {
        throw new Error(`Неизвестный key "${dataNode.key}" для узла node!`);
      }
    }
  }

  if (parent !== undefined) {
    state.parent = parent.id;
  }

  if (node.graph !== undefined) {
    processGraph(elements, node.graph, meta, awailableDataProperties, node);
  }

  return state;
}

function emptyOuterComponent(): OuterComponent {
  return {
    id: '',
    name: '',
    humanName: '',
    type: '',
    parameters: {},
  };
}

function processGraph(
  elements: Elements,
  xml: any,
  meta: Meta,
  awailableDataProperties: Map<string, Map<string, KeyProperties>>,
  parent?: Node
): Map<string, State> {
  const graph: Graph = xml;
  const nodes: Node[] = graph.node;
  const edges: Edge[] = graph.edge;
  if (meta.platform == 'ArduinoUno' && parent == undefined) {
    if (graph.edge) {
      for (const idx in edges) {
        const edge = graph.edge[idx];
        if (edge.source == '') {
          components_id.push(edge.target);
          delete graph.edge[idx];
        }
      }
    }

    for (const idx in nodes) {
      const node = nodes[idx];
      if (components_id.includes(node.id)) {
        const component = emptyOuterComponent();
        component.id = node.id;
        processNode(elements, node, meta, awailableDataProperties, parent, component);
        delete graph.node[idx];

        if (!elements.components[component.name]) {
          elements.components[component.name] = {
            type: component.type,
            parameters: component.parameters,
          };
        } else {
          throw new Error(`Компонент с именем ${component.name} уже существует!`);
        }
      }
    }
  }

  for (const idx in graph.node) {
    const node = graph.node[idx];
    elements.states[node.id] = processNode(elements, node, meta, awailableDataProperties, parent);
  }

  if (graph.edge) {
    processTransitions(elements, meta, graph.edge);
  }

  return new Map<string, State>();
}

// Добавляет допустимые свойства у узлов (dData, dInitial и т.д)
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
        throw new Error(`Дублирование свойства ${keyNode.id} для узла ${keyNode.for}!`);
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
const components_id = new Array<string>();
// Ключ - id компонента, значение - компонент
// const components = new Map<string, Component | OuterComponent>();

const systemComponentAlias = new Map<string, Event>([
  ['entry', { component: 'System', method: 'onEnter' }],
  ['exit', { component: 'System', method: 'onExit' }],
]);

export function importGraphml(expression: string) {
  try {
    platform = undefined;
    components_id.splice(0);
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
      initialState: {
        target: '',
        position: { x: 0, y: 0 },
      },
      components: {},
      platform: '',
    };

    const awailableDataProperties = new Map<string, Map<string, KeyProperties>>();
    const xml = parser.parse(expression);
    setFormatToMeta(elements, xml, meta);
    addPropertiesFromKeyNode(xml, awailableDataProperties);
    switch (meta.format) {
      case 'Cyberiada-GraphML': {
        const indexOfMetaNode = (xml.graphml.graph.node as Array<Node>).findIndex(
          (node) => node.id == ''
        );
        if (indexOfMetaNode !== -1) {
          processNode(
            elements,
            xml.graphml.graph.node[indexOfMetaNode],
            meta,
            awailableDataProperties
          );
          xml.graphml.graph.node = (xml.graphml.graph.node as Array<Node>).filter(
            (value) => value.id !== ''
          );
          getAllComponents(elements, meta);
          processGraph(elements, xml.graphml.graph, meta, awailableDataProperties);
        } else {
          throw new Error('Отсутствует мета-узел!');
        }

        break;
      }
      default: {
        // TODO сделать модалкой
        throw new Error(`ОШИБКА! НЕИЗВЕСТНЫЙ ФОРМАТ "${meta.format}"!`);
      }
    }
    delete elements.states[''];
    elements.platform = meta.platform;
    exportGraphml(elements);
    return elements;
  } catch (error) {
    console.log(error);
    return emptyElements();
  }
}

type ExportKeyNode = {
  '@id': string;
  '@for': string;
  '@attr.name'?: string;
  '@attr.type'?: string;
};

type ExportDataNode = {
  '@key': string;
  '@x'?: number;
  '@y'?: number;
  '@width'?: number;
  '@height'?: number;
  content: string;
};

type ExportEdge = {
  '@source': string;
  '@target': string;
  data?: Array<ExportDataNode>;
};

type ExportGraph = {
  '@id': string;
  node: Array<ExportNode>;
  edge: Array<ExportEdge>;
};

type ExportNode = {
  '@id': string;
  data: Array<ExportDataNode>;
  graph?: ExportGraph;
};

function getArgsString(args: ArgList | undefined): string {
  if (args !== undefined) {
    return Object.values(args).join(', ');
  }

  return '';
}

export function exportGraphml(elements: Elements) {
  const builder = new XMLBuilder({
    textNodeName: 'content',
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    format: true,
  });

  const keyNodes: Array<ExportKeyNode> = [
    {
      '@id': 'dName',
      '@for': 'node',
      '@attr.name': 'name',
      '@attr.type': 'string',
    },
    {
      '@id': 'dData',
      '@for': 'node',
      '@attr.name': 'data',
      '@attr.type': 'string',
    },
    {
      '@id': 'dData',
      '@for': 'edge',
      '@attr.name': 'data',
      '@attr.type': 'string',
    },
    {
      '@id': 'dInitial',
      '@for': 'node',
      '@attr.name': 'initial',
      '@attr.type': 'string',
    },
    {
      '@id': 'dGeometry',
      '@for': 'edge',
    },
    {
      '@id': 'dGeometry',
      '@for': 'node',
    },
    {
      '@id': 'dColor',
      '@for': 'edge',
    },
  ];

  const nodes: Array<ExportNode> = [
    {
      '@id': '',
      data: [
        {
          '@key': 'dName',
          content: elements.platform,
        },
        {
          '@key': 'dData',
          content: `description/ Схема, сгенерированная с помощью Lapki IDE\nname/ Схема`,
        },
      ],
    },
  ];

  const graph: ExportGraph = {
    '@id': 'G',
    node: nodes,
    edge: [],
  };

  for (const component_idx in elements.components) {
    const component = elements.components[component_idx];
    let content = `type/ ${component.type}\n`;
    for (const parameter_idx in component.parameters) {
      const parameter = component.parameters[parameter_idx];
      content += `${parameter_idx}/ ${parameter}\n`;
    }
    nodes.push({
      '@id': component_idx,
      data: [
        {
          '@key': 'dName',
          content: component_idx,
        },
        {
          '@key': 'dData',
          content: content,
        },
      ],
    });
    const edge: ExportEdge = {
      '@source': '',
      '@target': component_idx,
    };
    graph.edge.push(edge);
  }

  for (const state_id in elements.states) {
    const state = elements.states[state_id];
    const node: ExportNode = {
      '@id': state_id,
      data: [],
    };

    node.data.push({
      '@key': 'dName',
      content: state.name,
    });

    node.data.push({
      '@key': 'dGeometry',
      '@x': state.bounds.x,
      '@y': state.bounds.y,
      '@width': state.bounds.width,
      '@height': state.bounds.height,
      content: '',
    });

    let content = '';

    for (const event of state.events) {
      const trigger = `${event.trigger.component}.${event.trigger.method}(${getArgsString(
        event.trigger.args
      )})`;

      let content_action = '';
      
      
      let component = event.trigger.component;
      let method = event.trigger.method;
      let trig 
      if (component == 'System') {
        if (method == 'onEnter') {
          
        }
        else if (method == 'onExit') {

        }
      }
      
      for (const action of event.do) {
        content_action += `${action.component}.${action.method}(${getArgsString(action.args)})\n`;
      }

      content += `${trigger}/${content_action}\n`;
    }

    node.data.push({
      '@key': 'dData',
      content: content,
    });

    nodes.push(node);
    // if (state.parent !== undefined) {
      
    // }
  }

  const testObj = {
    '?xml': {
      '@version': 1.0,
      '@encoding': 'UTF-8',
    },
    graphml: {
      data: {
        '@key': 'gFormat',
        content: 'Cyberiada-Graphml',
      },
      key: keyNodes,
      graph: graph,
    },
  };

  console.log(builder.build(testObj));
}
