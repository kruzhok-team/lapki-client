import { Platform, platform } from '@floating-ui/react-dom';
import {
  CGMLElements,
  parseCGML,
  CGMLInitialState,
  CGMLNote,
  CGMLState,
  CGMLTransition,
} from '@kruzhok-team/cyberiadaml-js';

import {
  Action,
  ArgList,
  Component,
  Condition,
  Elements,
  Event,
  EventData,
  InitialState,
  Note,
  State,
  Transition,
  Variable,
} from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';

import { getPlatform, isPlatformAvailable } from './PlatformLoader';

const randomColor = (): string => {
  let result = '';
  for (let i = 0; i < 6; ++i) {
    const value = Math.floor(16 * Math.random());
    result += value.toString(16);
  }
  return '#' + result;
};

const operatorAlias = new Map<string, string>([
  ['===', 'equals'],
  ['!=', 'notEquals'],
  ['>', 'greater'],
  ['<', 'less'],
  ['>=', 'greaterOrEqual'],
  ['<=', 'lessOrEqual'],
]);

const invertOperatorAlias = new Map<string, string>(
  [...operatorAlias.entries()].map((a) => [a[1], a[0]])
);

function checkConditionTokenType(token: string): Condition {
  if (token.includes('.')) {
    const [component, method] = token.split('.');
    ``;

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

function parseCondition(condition: string): Condition {
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
function parseNodeData(elements: Elements, content: string, state: State) {
  // По формату CyberiadaGraphML события разделены пустой строкой.
  if (content !== undefined) {
    const unprocessedEventsAndActions = content.split('\n\n');
    for (const event of unprocessedEventsAndActions) {
      const result = parseEvent(elements, event);
      if (result !== undefined) {
        state.events.push(result[0]);
      }
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
        if (component.type === '') {
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
        if (component.description === undefined) {
          component.description = value;
        } else {
          throw new Error(
            `Описание компонента ${component.name} уже указано! Предыдущее описание ${component.description}, новое - ${value}`
          );
        }
        break;
      }
      case 'labelColor':
      case 'label': {
        component.parameters[parameterName] = value;
        break;
      }
      case 'name': {
        if (component.humanName === undefined || component.humanName === '') {
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

function parseEvent(event: string): [EventData, Condition?] | undefined {
  if (event.includes('/')) {
    let [trigger, stringActions] = event.split('/');
    trigger = trigger.trim();
    let condition: Condition | undefined;
    const actions = parseActions(stringActions.trim());
    if (trigger !== undefined) {
      if (trigger.includes('[')) {
        const event = trigger.split('[');
        trigger = event[0];
        condition = parseCondition(event[1].replace(']', ''));
      }
      let ev = systemComponentAlias.get(trigger); // Подстановка exit/entry на System.onExit/System.onEnter

      if (ev === undefined) {
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

function initArgList(args: string[]): ArgList {
  const argList: ArgList = {};
  args.forEach((value: string, index: number) => {
    argList[`${index}`] = value;
  });

  return argList;
}

function parseAction(unproccessedAction: string): Action | undefined {
  const [component_name, action] = unproccessedAction.trim().split('.');
  if (action !== undefined) {
    // На случай, если действий у события нет
    const bracketPos = action.indexOf('(');
    const args = action
      .slice(bracketPos + 1, action.length - 1)
      .split(',')
      .filter((value) => value !== ''); // Фильтр нужен, чтобы отсеять пустое значение в случае отсутствия аргументов.
    const method = action.slice(0, bracketPos);
    return {
      component: component_name,
      method: method,
      args: initArgList(args),
    };

    // const component = elements.components[component_name];
    // const argList: ArgList = {};
    // Если параметров у метода нет, то methodParameters будет равен undefined
    // if (component !== undefined) {
    //   const methodParameters = platform?.components[component.type]?.methods[method]?.parameters;
    //   if (
    //     platform?.components[component.type] !== undefined &&
    //     platform?.components[component.type].methods[method] !== undefined
    //   ) {
    //     for (const index in methodParameters) {
    //       const parameter: ArgumentProto = methodParameters[index];
    //       if (args[index] !== undefined && args[index] !== '') {
    //         argList[parameter.name] = args[index];
    //       } else {
    //         throw new Error(`У ${component_name}.${method} отсутствует параметр ${parameter.name}`); // TODO Модалка
    //       }
    //     }
    //     if (methodParameters === undefined) {
    //       if (args.length === 0) {
    //         resultAction.args = argList;
    //       } else {
    //         throw new Error(
    //           `Неправильное количество аргументов у функции ${method} компонента ${component_name}.\n Нужно: 0, получено: ${args.length}`
    //         );
    //       }
    //     } else {
    //       if (Object.keys(argList).length === Object.keys(methodParameters).length) {
    //         resultAction.args = argList;
    //       } else {
    //         throw new Error(
    //           `Неправильное количество аргументов у функции ${method} компонента ${component_name}.\n Нужно: ${
    //             Object.keys(methodParameters).length
    //           }, получено: ${args.length}`
    //         );
    //       }
    //     }
    //     return resultAction;
    //   } else {
    //     throw new Error(`Неизвестный метод ${method} у компонента ${component_name}`);
    //   }
    // } else {
    //   throw new Error(`Неизвестный компонент ${component_name}`);
    // }
  } else {
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
  } else {
    console.log('Отсутствуют действия на событие');
    return;
  }
}

function getInitialState(rawInitialState: CGMLInitialState | null): InitialState | null {
  if (rawInitialState !== null) {
    if (rawInitialState.position !== undefined) {
      return {
        target: rawInitialState.target,
        position: {
          x: rawInitialState.position.x,
          y: rawInitialState.position.y,
        },
      };
    } else {
      throw new Error('No position of initial state!');
    }
  }

  return null;
}

function getStates(rawStates: { [id: string]: CGMLState }): { [id: string]: State } {
  const states: { [id: string]: State } = {};

  for (const rawStateId in rawStates) {
    const rawState = rawStates[rawStateId];
    states[rawStateId] = {
      name: rawState.name,
      bounds: rawState.bounds,
      parent: rawState.parent,
      events: parseStateEvents(rawState.actions),
    };
  }

  return states;
}

function getTransitions(rawTransitions: CGMLTransition[]): Transition[] {
  const transitions: Transition[] = [];

  return transitions;
}

function parseStateEvents(content: string): EventData[] {
  // По формату CyberiadaGraphML события разделены пустой строкой.
  const events: EventData[] = [];
  const unprocessedEventsAndActions = content.split('\n\n');
  for (const unprocessedEvent of unprocessedEventsAndActions) {
    const result = parseEvent(unprocessedEvent);
    if (result !== undefined) {
      const [event, condition] = result;
      events.push(event);
    }
  }

  return events;
}

function getNotes(rawNotes: { [id: string]: CGMLNote }): Note[] {
  const notes: Note[] = [];

  for (const rawNoteId in rawNotes) {
    const rawNote: CGMLNote = rawNotes[rawNoteId];
    notes.push({
      ...rawNote,
    });
  }

  return notes;
}

// Функция получает на вход строку, в которой мета-информация разделена символами / и \n
function parseMeta(unproccessedMeta: string): { [id: string]: string } {
  const splitedMeta = unproccessedMeta.split('\n');
  const meta: { [id: string]: string } = {};
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
  return meta;
}

const systemComponentAlias = new Map<string, Event>([
  ['entry', { component: 'System', method: 'onEnter' }],
  ['exit', { component: 'System', method: 'onExit' }],
]);

export function importGraphml(
  expression: string,
  openImportError: (error: string) => void
): Elements {
  try {
    const rawElements: CGMLElements = parseCGML(expression);

    const elements: Elements = {
      states: {},
      transitions: [],
      notes: [],
      initialState: null,
      components: {},
      platform: rawElements.platform,
      meta: {},
    };

    if (isPlatformAvailable(rawElements.platform)) {
      elements.meta = parseMeta(rawElements.meta);
      const initialState: InitialState | null = getInitialState(rawElements.initialState);
      if (initialState !== null) {
        elements.initialState = initialState;
      }
      elements.notes = getNotes(rawElements.notes);
      elements.states = getStates(rawElements.states);
      elements.transitions = getTransitions(rawElements.transitions);
    } else {
      throw new Error(`Неизвестная платформа ${rawElements.platform}.`);
    }

    return elements;
  } catch (error) {
    console.log(error);
    openImportError((error as any).message);

    return {
      states: {},
      transitions: [],
      notes: [],
      initialState: {
        target: '',
        position: { x: 0, y: 0 },
      },
      components: {},
      platform: '',
      meta: {},
    };
  }
}

function getOperandString(operand: Variable | string | Condition[] | number) {
  if (isVariable(operand)) {
    return `${(operand as Variable).component}.${(operand as Variable).method}`;
  } else {
    return operand;
  }
}

const PlatformKeys: PlatformDataKeys = {
  ArduinoUno: [
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
    {
      '@id': 'dNote',
      '@for': 'node',
    },
  ],
  BearlogaDefend: [
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
      '@id': 'dNote',
      '@for': 'node',
    },
  ],
};
