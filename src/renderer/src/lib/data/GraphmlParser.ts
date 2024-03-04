import {
  CGMLElements,
  parseCGML,
  CGMLInitialState,
  CGMLNote,
  CGMLState,
  CGMLTransition,
  CGMLComponent,
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
  Meta,
} from '@renderer/types/diagram';
import { Platform, ArgumentProto, ComponentProto, MethodProto } from '@renderer/types/platform';

import { validateElements } from './ElementsValidator';
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

function emptyComponent(): Component {
  return {
    type: '',
    parameters: {},
  };
}

function parseComponentNode(content: string, componentId: string): [Component, Meta] {
  const component: Component = emptyComponent();
  const meta: { [id: string]: string } = {};
  const unprocessedParameters = content.split('\n');
  for (const parameter of unprocessedParameters) {
    let [parameterName, value] = parameter.split('/');
    parameterName = parameterName.trim();
    value = value.trim();
    switch (parameterName) {
      case 'type': {
        if (component.type === '') {
          component.type = value;
        } else {
          throw new Error(
            `Тип у компонента ${componentId} уже указан! Предыдущий тип ${component.type}, новый - ${value}`
          );
        }
        break;
      }
      case 'description': {
        if (meta['description'] === undefined) {
          meta['description'] = value;
        } else {
          throw new Error(
            `Описание компонента у ${componentId} уже указано! Предыдущее описание ${meta['description']}, новое - ${value}`
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
        if (meta['name'] === undefined) {
          meta['name'] = value;
        } else {
          throw new Error(
            `Имя компонента ${componentId} уже указано! Предыдущее имя ${meta['name']}, новое - ${value}`
          );
        }
        break;
      }
      default:
        component.parameters[parameterName] = value;
    }
  }
  return [component, meta];
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

function initArgList(args: string[]): ArgList {
  const argList: ArgList = {};
  // Затычка, чтобы не прокидывать повсюду платформу и компоненты.
  // Настоящие название аргументов подтягиваются позднее.
  args.forEach((value: string, index: number) => {
    argList[`${index}`] = value.trim();
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
  } else {
    return;
  }
}

function parseActions(unsplitedActions: string): Action[] | undefined {
  if (unsplitedActions != '') {
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
  console.log(rawInitialState);
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

function parseTransitionEvents(rawEvents: string): [EventData, Condition?] | undefined {
  const rawTriggerAndAction = rawEvents.split('\n\n');
  if (rawTriggerAndAction.length > 1) {
    throw new Error('Поддерживаются события только с одним триггером!');
  }
  for (const rawEvent of rawTriggerAndAction) {
    const result = parseEvent(rawEvent);
    if (result !== undefined) {
      const [event, condition] = result;
      return [event, condition];
    }
  }
  return;
}

function getTransitions(
  rawTransitions: CGMLTransition[],
  initialStateId: string | undefined
): Transition[] {
  const transitions: Transition[] = [];
  for (const rawTransition of rawTransitions) {
    if (rawTransition.actions == undefined) {
      if (initialStateId == rawTransition.source) {
        continue;
      } else {
        throw new Error('Безусловный (без триггеров) переход не поддерживается.');
      }
    }
    const parsedEvent = parseTransitionEvents(rawTransition.actions);
    if (parsedEvent == undefined) {
      console.log(rawTransition);
      throw new Error('Безусловный (без триггеров) переход не поддерживается.');
    }
    const [eventData, condition] = parsedEvent;
    transitions.push({
      source: rawTransition.source,
      target: rawTransition.target,
      color: rawTransition.color !== undefined ? rawTransition.color : randomColor(),
      position: rawTransition.position !== undefined ? rawTransition.position : { x: -1, y: -1 },
      trigger: eventData.trigger,
      do: eventData.do,
      condition: condition,
    });
  }
  return transitions;
}

function parseStateEvents(content: string): EventData[] {
  // По формату CyberiadaGraphML события разделены пустой строкой.
  const events: EventData[] = [];
  const unprocessedEventsAndActions = content.split('\n\n');
  for (const unprocessedEvent of unprocessedEventsAndActions) {
    const result = parseEvent(unprocessedEvent);
    if (result !== undefined) {
      const [event, condition] = result; // У нас не поддерживаются условия в событиях в состоянии
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

function getComponents(rawComponents: { [id: string]: CGMLComponent }): {
  [id: string]: Component;
} {
  const components: { [id: string]: Component } = {};
  for (const id in rawComponents) {
    const rawComponent = rawComponents[id];
    const [component, meta] = parseComponentNode(rawComponent.parameters, id);
    components[id] = component;
  }
  console.log(rawComponents);
  console.log(components);
  return components;
}

function labelParameters(args: ArgList, method: MethodProto): ArgList {
  const labeledArgs: ArgList = { ...args };
  method.parameters?.forEach((element, index) => {
    labeledArgs[element.name] = args[`${index}`];
    delete labeledArgs[`${index}`];
  });
  return labeledArgs;
}

export function getProtoMethod(
  method: string,
  component: ComponentProto | undefined
): MethodProto | undefined {
  return component?.methods[method];
}

export function getProtoComponent(
  component: string,
  platformComponents: { [name: string]: ComponentProto },
  components: { [name: string]: Component }
): ComponentProto | undefined {
  return platformComponents[components[component]?.type];
}

function labelStateParameters(
  states: { [id: string]: State },
  platformComponents: { [name: string]: ComponentProto },
  components: { [name: string]: Component }
): { [id: string]: State } {
  const labeledStates: { [id: string]: State } = {};
  for (const stateIdx in states) {
    const state = states[stateIdx];
    const labeledState = { ...state };
    console.log(labeledState);
    for (const eventIdx in labeledState.events) {
      const event = labeledState.events[eventIdx];
      console.log(event);
      for (const actionIdx in event.do) {
        const action = event.do[actionIdx];
        if (action.args !== undefined) {
          const component: ComponentProto | undefined = getProtoComponent(
            action.component,
            platformComponents,
            components
          );
          const method: MethodProto | undefined = getProtoMethod(action.method, component);
          if (component !== undefined && method !== undefined) {
            labeledState.events[eventIdx].do[actionIdx].args = labelParameters(action.args, method);
          }
        }
      }
    }
    labeledStates[stateIdx] = labeledState;
  }
  console.log(labeledStates);
  return labeledStates;
}

function labelTransitionParameters(
  transitions: Transition[],
  platformComponents: { [name: string]: ComponentProto },
  components: { [name: string]: Component }
): Transition[] {
  const labeledTransitions: Transition[] = [];

  for (const transition of transitions) {
    const labeledTransition: Transition = transition;
    if (labeledTransition.do !== undefined) {
      for (const actionIdx in labeledTransition.do) {
        const action = labeledTransition.do[actionIdx];
        // FIXME: DRY
        if (action.args !== undefined) {
          const component: ComponentProto | undefined = getProtoComponent(
            action.component,
            platformComponents,
            components
          );
          const method: MethodProto | undefined = getProtoMethod(action.method, component);
          if (component !== undefined && method !== undefined) {
            labeledTransition.do[actionIdx].args = labelParameters(action.args, method);
          }
        }
      }
    }
    labeledTransitions.push(labeledTransition);
  }

  return labeledTransitions;
}

function getAllComponent(platformComponents: { [name: string]: ComponentProto }): {
  [name: string]: Component;
} {
  const components: {
    [name: string]: Component;
  } = {};

  for (const id in platformComponents) {
    components[id] = {
      type: id,
      parameters: {},
    };
  }

  return components;
}

const systemComponentAlias = new Map<string, Event>([
  ['entry', { component: 'System', method: 'onEnter' }],
  ['exit', { component: 'System', method: 'onExit' }],
]);

export function importGraphml(
  expression: string,
  openImportError: (error: string) => void
): Elements | undefined {
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
      // TODO: добавить в платформу флаг для статических компонентов
      const platform: Platform | undefined = getPlatform(elements.platform);
      if (platform == undefined) {
        throw new Error('Internal error: undefined getPlatform result, but platform is avaialble.');
      }
      if (elements.platform.startsWith('Bearloga')) {
        elements.components = getAllComponent(platform.components);
      } else {
        elements.components = getComponents(rawElements.components);
      }
      elements.meta = parseMeta(rawElements.meta);
      const initialState: InitialState | null = getInitialState(rawElements.initialState);
      if (initialState !== null) {
        elements.initialState = initialState;
      }
      elements.notes = getNotes(rawElements.notes);
      elements.states = getStates(rawElements.states);
      elements.transitions = getTransitions(rawElements.transitions, rawElements.initialState?.id);
      console.log(JSON.stringify(elements.states));
      elements.states = labelStateParameters(
        elements.states,
        platform.components,
        elements.components
      );
      elements.transitions = labelTransitionParameters(
        elements.transitions,
        platform.components,
        elements.components
      );
      console.log(JSON.stringify(elements.transitions));

      validateElements(elements, platform);
    } else {
      throw new Error(`Неизвестная платформа ${rawElements.platform}.`);
    }
    return elements;
  } catch (error) {
    console.log(error);
    openImportError((error as any).message);
    return;
  }
}

// function getOperandString(operand: Variable | string | Condition[] | number) {
//   if (isVariable(operand)) {
//     return `${(operand as Variable).component}.${(operand as Variable).method}`;
//   } else {
//     return operand;
//   }
// }

// const PlatformKeys: PlatformDataKeys = {
//   ArduinoUno: [
//     {
//       '@id': 'dName',
//       '@for': 'node',
//       '@attr.name': 'name',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dData',
//       '@for': 'node',
//       '@attr.name': 'data',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dData',
//       '@for': 'edge',
//       '@attr.name': 'data',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dInitial',
//       '@for': 'node',
//       '@attr.name': 'initial',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dGeometry',
//       '@for': 'edge',
//     },
//     {
//       '@id': 'dGeometry',
//       '@for': 'node',
//     },
//     {
//       '@id': 'dColor',
//       '@for': 'edge',
//     },
//     {
//       '@id': 'dNote',
//       '@for': 'node',
//     },
//   ],
//   BearlogaDefend: [
//     {
//       '@id': 'dName',
//       '@for': 'node',
//       '@attr.name': 'name',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dData',
//       '@for': 'node',
//       '@attr.name': 'data',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dData',
//       '@for': 'edge',
//       '@attr.name': 'data',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dInitial',
//       '@for': 'node',
//       '@attr.name': 'initial',
//       '@attr.type': 'string',
//     },
//     {
//       '@id': 'dGeometry',
//       '@for': 'edge',
//     },
//     {
//       '@id': 'dGeometry',
//       '@for': 'node',
//     },
//     {
//       '@id': 'dNote',
//       '@for': 'node',
//     },
//   ],
// };

export function exportGraphml(elements: Elements): string {
  return '';
}
