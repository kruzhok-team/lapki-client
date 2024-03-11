import {
  CGMLElements,
  parseCGML,
  CGMLInitialState,
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
  EventData,
  InitialState,
  State,
  Transition,
  Meta,
} from '@renderer/types/diagram';
import { Platform, ComponentProto, MethodProto } from '@renderer/types/platform';

import { validateElements } from './ElementsValidator';
import { getPlatform, isPlatformAvailable } from './PlatformLoader';

const systemComponentAlias = {
  entry: { component: 'System', method: 'onEnter' },
  exit: { component: 'System', method: 'onExit' },
};

const randomColor = (): string => {
  let result = '';
  for (let i = 0; i < 6; ++i) {
    const value = Math.floor(16 * Math.random());
    result += value.toString(16);
  }
  return '#' + result;
};

const operatorAlias = {
  '==': 'equals',
  '!=': 'notEquals',
  '>': 'greater',
  '<': 'less',
  '>=': 'greaterOrEqual',
  '<=': 'lessOrEqual',
};

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

function parseCondition(condition: string): Condition {
  const tokens = condition.split(' ');
  const lval = checkConditionTokenType(tokens[0]);
  const operator = operatorAlias[tokens[1]];
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
    transitionId: '',
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
  if (!event.includes('/')) throw new Error(`Не определен триггер для действий ${event}`);
  let [trigger, stringActions] = event.split('/');
  trigger = trigger.trim();
  stringActions = stringActions.trim();
  let condition: Condition | undefined;
  const actions = parseActions(stringActions);
  if (trigger === undefined) return;
  if (trigger.includes('[')) {
    const event = trigger.split('[');
    trigger = event[0];
    condition = parseCondition(event[1].replace(']', ''));
  }
  let ev = systemComponentAlias[trigger]; // Подстановка exit/entry на System.onExit/System.onEnter
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

// Затычка, чтобы не прокидывать повсюду платформу и компоненты.
// Настоящие название аргументов подтягиваются позднее.
function initArgList(args: string[]): ArgList {
  const argList: ArgList = {};
  args.forEach((value, index) => {
    argList[index] = value.trim();
  });
  return argList;
}

function parseAction(unproccessedAction: string): Action | undefined {
  const [componentName, action] = unproccessedAction.trim().split('.');
  if (action === undefined) {
    return;
  }
  // На случай, если действий у события нет
  const bracketPos = action.indexOf('(');
  const args = action
    .slice(bracketPos + 1, action.length - 1)
    .split(',')
    .filter((value) => value !== ''); // Фильтр нужен, чтобы отсеять пустое значение в случае отсутствия аргументов.
  const method = action.slice(0, bracketPos);
  return {
    component: componentName,
    method: method,
    args: initArgList(args),
  };
}

function parseActions(unsplitedActions: string): Action[] | undefined {
  if (unsplitedActions === '') {
    console.log('Отсутствуют действия на событие');
    return;
  }
  // Считаем, что действия находятся на разных строках
  const actions = unsplitedActions.split('\n');
  const resultActions: Action[] = [];
  for (const unprocessedAction of actions) {
    const resultAction = parseAction(unprocessedAction);
    if (resultAction !== undefined) {
      resultActions.push(resultAction);
    }
  }
  return resultActions;
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

function parseTransitionEvents(rawEvents: string): [EventData, Condition?] | undefined {
  const rawTriggerAndAction = rawEvents.split('\n\n');
  if (rawTriggerAndAction.length > 1) {
    throw new Error('Поддерживаются события только с одним триггером!');
  }
  const result = parseEvent(rawTriggerAndAction[0]);
  if (result !== undefined) {
    return result;
  }
  return;
}

function getTransitions(
  rawTransitions: Record<string, CGMLTransition>,
  initialStateId?: string
): Record<string, Transition> {
  const transitions: Record<string, Transition> = {};
  for (const id in rawTransitions) {
    const rawTransition = rawTransitions[id];
    if (rawTransition.actions == undefined) {
      if (initialStateId == rawTransition.source) continue;
      throw new Error('Безусловный (без триггеров) переход не поддерживается.');
    }
    const parsedEvent = parseTransitionEvents(rawTransition.actions);
    if (parsedEvent == undefined) {
      throw new Error('Безусловный (без триггеров) переход не поддерживается.');
    }
    const [eventData, condition] = parsedEvent;
    transitions[id] = {
      source: rawTransition.source,
      target: rawTransition.target,
      color: rawTransition.color ?? randomColor(),
      position: rawTransition.position ?? { x: -1, y: -1 },
      trigger: eventData.trigger,
      do: eventData.do,
      condition: condition,
    };
  }
  return transitions;
}

function parseStateEvents(content: string | undefined): EventData[] {
  // По формату CyberiadaGraphML события разделены пустой строкой.
  if (content === undefined) {
    return [];
  }
  const events: EventData[] = [];
  const unprocessedEventsAndActions = content.split('\n\n');
  for (const unprocessedEvent of unprocessedEventsAndActions) {
    const result = parseEvent(unprocessedEvent);
    if (result !== undefined) {
      const event = result[0]; // У нас не поддерживаются условия в событиях в состоянии
      events.push(event);
    }
  }
  return events;
}

// Функция получает на вход строку, в которой мета-информация разделена символами / и \n
function parseMeta(unproccessedMeta: string | undefined): { [id: string]: string } {
  if (unproccessedMeta === undefined) {
    return {};
  }
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
    const component = parseComponentNode(rawComponent.parameters, id)[0];
    components[id] = { ...component, transitionId: rawComponent.transitionId };
  }
  return components;
}

function labelParameters(args: ArgList, method: MethodProto): ArgList {
  const labeledArgs: ArgList = { ...args };
  method.parameters?.forEach((element, index) => {
    labeledArgs[element.name] = args[index];
    delete labeledArgs[index];
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
    for (const eventIdx in labeledState.events) {
      const event = labeledState.events[eventIdx];
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
  return labeledStates;
}

function labelTransitionParameters(
  transitions: Record<string, Transition>,
  platformComponents: { [name: string]: ComponentProto },
  components: { [name: string]: Component }
): Record<string, Transition> {
  const labeledTransitions: Record<string, Transition> = {};

  for (const id in transitions) {
    const labeledTransition: Transition = transitions[id];
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
    labeledTransitions[id] = labeledTransition;
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
      transitionId: '',
      type: id,
      parameters: {},
    };
  }
  return components;
}

export function importGraphml(
  expression: string,
  openImportError: (error: string) => void
): Elements | undefined {
  try {
    const rawElements: CGMLElements = parseCGML(expression);
    const elements: Elements = {
      states: {},
      transitions: {},
      notes: {},
      initialState: null,
      components: {},
      platform: rawElements.platform,
      meta: {},
    };
    if (!isPlatformAvailable(rawElements.platform)) {
      throw new Error(`Неизвестная платформа ${rawElements.platform}.`);
    }
    // TODO: добавить в платформу флаг для статических компонентов
    const platform: Platform | undefined = getPlatform(elements.platform);
    if (platform === undefined) {
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
    elements.notes = rawElements.notes;
    elements.states = getStates(rawElements.states);
    elements.transitions = getTransitions(rawElements.transitions, rawElements.initialState?.id);
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
    validateElements(elements, platform);
    return elements;
  } catch (error) {
    console.log(error);
    openImportError((error as any).message);
    return;
  }
}
