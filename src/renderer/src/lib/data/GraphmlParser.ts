import {
  CGMLElements,
  parseCGML,
  CGMLInitialState,
  CGMLState,
  CGMLTransition,
  CGMLComponent,
  CGMLAction,
  CGMLTransitionAction,
  CGMLVertex,
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
  Event,
  FinalState,
  ChoiceState,
} from '@renderer/types/diagram';
import { Platform, ComponentProto, MethodProto, SignalProto } from '@renderer/types/platform';

import { validateElements } from './ElementsValidator';
import { getPlatform, isPlatformAvailable } from './PlatformLoader';

const systemComponentAlias = {
  entry: { component: 'System', method: 'onEnter' },
  exit: { component: 'System', method: 'onExit' },
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

function parseEvent(trigger: string): Event | undefined {
  if (trigger === undefined) return;
  let ev: Event = systemComponentAlias[trigger]; // Подстановка exit/entry на System.onExit/System.onEnter
  if (ev === undefined) {
    const [component, method] = trigger.split('.');
    ev = {
      component: component,
      method: method,
    };
  }
  return ev;
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
  let [componentName, action] = unproccessedAction.trim().split('.');
  if (action === undefined) {
    return;
  }
  // Если в конце действия стоит делимитер, удаляем его
  if (!action.endsWith(')')) {
    action = action.slice(0, -1);
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

function getFinals(rawFinalStates: { [id: string]: CGMLVertex }): { [id: string]: FinalState } {
  const finalStates: { [id: string]: FinalState } = {};
  for (const finalId in rawFinalStates) {
    const final = rawFinalStates[finalId];
    finalStates[finalId] = {
      position: final.position
        ? {
            x: final.position.x,
            y: final.position.y,
          }
        : { x: -1, y: -1 },
      parentId: final.parent,
    };
  }
  return finalStates;
}

function getInitialStates(rawInitialStates: { [id: string]: CGMLInitialState }): {
  [id: string]: InitialState;
} {
  const initialStates: { [id: string]: InitialState } = {};
  for (const initialId in rawInitialStates) {
    const rawInitial = rawInitialStates[initialId];
    if (!rawInitial.position) {
      throw new Error(`Не указана позиция начального состояния с идентификатором ${initialId}`);
    }
    initialStates[initialId] = {
      position: rawInitial.position,
      parentId: rawInitial.parent,
    };
  }
  return initialStates;
}

function getChoices(rawChoices: { [id: string]: CGMLVertex }): {
  [id: string]: InitialState;
} {
  const choices: { [id: string]: ChoiceState } = {};
  for (const choiceId in rawChoices) {
    const rawChoice = rawChoices[choiceId];
    if (!rawChoice.position) {
      throw new Error(`Не указана позиция псевдосостояния выбора с идентификатором ${choiceId}`);
    }
    choices[choiceId] = {
      position: rawChoice.position,
      parentId: rawChoice.parent,
    };
  }
  return choices;
}

function getStates(rawStates: { [id: string]: CGMLState }): { [id: string]: State } {
  const states: { [id: string]: State } = {};
  for (const rawStateId in rawStates) {
    const rawState = rawStates[rawStateId];
    const events: EventData[] = actionsToEventData(rawState.actions);
    states[rawStateId] = {
      // ПОМЕНЯТЬ ЦВЕТ
      color: rawState.color ?? '#FFFFFF',
      name: rawState.name,
      dimensions: {
        width: rawState.bounds.width,
        height: rawState.bounds.height,
      },
      position: {
        x: rawState.bounds.x,
        y: rawState.bounds.y,
      },
      parentId: rawState.parent,
      events: events,
    };
  }
  return states;
}

function actionsToEventData(rawActions: Array<CGMLAction | CGMLTransitionAction>): EventData[] {
  const eventDataArr: EventData[] = [];
  for (const action of rawActions) {
    const eventData: EventData = {
      trigger: {
        component: '',
        method: '',
      },
      do: [],
    };
    const doActions: Action[] = [];
    if (action.action) {
      const parsedActions = parseActions(action.action);
      if (parsedActions) {
        doActions.push(...parsedActions);
      }
      eventData.do = doActions;
    }
    if (action.trigger?.event) {
      const trigger = parseEvent(action.trigger.event);
      if (trigger) {
        eventData.trigger = trigger;
      }
    }
    if (action.trigger?.condition) {
      eventData.condition = parseCondition(action.trigger.condition);
    }
    eventDataArr.push(eventData);
  }
  return eventDataArr;
}

function getTransitions(
  rawTransitions: Record<string, CGMLTransition>
): Record<string, Transition> {
  const transitions: Record<string, Transition> = {};
  for (const id in rawTransitions) {
    const rawTransition = rawTransitions[id];
    if (rawTransition.actions.length == 0) {
      transitions[id] = {
        sourceId: rawTransition.source,
        targetId: rawTransition.target,
        color: rawTransition.color,
      };
      continue;
    }
    // В данный момент поддерживается только один триггер на переход
    const eventData = actionsToEventData(rawTransition.actions)[0];
    transitions[id] = {
      sourceId: rawTransition.source,
      targetId: rawTransition.target,
      color: rawTransition.color,
      label: {
        position: rawTransition.labelPosition ?? { x: -1, y: -1 },
        trigger: eventData.trigger,
        do: eventData.do,
        condition: eventData.condition,
      },
    };
  }
  return transitions;
}

function getComponents(rawComponents: { [id: string]: CGMLComponent }): {
  [id: string]: Component;
} {
  const components: { [id: string]: Component } = {};
  for (const id in rawComponents) {
    const rawComponent = rawComponents[id];
    if (rawComponent.order === undefined) {
      throw new Error('Ошибка парсинга схемы! Отсутствует порядок компонентов!');
    }
    components[rawComponent.id] = {
      type: rawComponent.type,
      parameters: rawComponent.parameters,
      order: rawComponent.order,
    };
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

export function getProtoSignal(
  signal: string,
  component: ComponentProto | undefined
): SignalProto | undefined {
  return component?.signals[signal];
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
    if (labeledTransition.label?.do !== undefined) {
      for (const actionIdx in labeledTransition.label.do) {
        const action = labeledTransition.label.do[actionIdx];
        // FIXME: DRY
        if (action.args !== undefined) {
          const component: ComponentProto | undefined = getProtoComponent(
            action.component,
            platformComponents,
            components
          );
          const method: MethodProto | undefined = getProtoMethod(action.method, component);
          if (component !== undefined && method !== undefined) {
            labeledTransition.label.do[actionIdx].args = labelParameters(action.args, method);
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
      type: id,
      parameters: {},
      order: 0,
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
      finalStates: {},
      initialStates: {},
      choiceStates: {},
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
    elements.meta = rawElements.meta.values;
    elements.initialStates = getInitialStates(rawElements.initialStates);
    elements.finalStates = getFinals(rawElements.finals);
    elements.notes = rawElements.notes;
    elements.states = getStates(rawElements.states);
    elements.transitions = getTransitions(rawElements.transitions);
    elements.states = labelStateParameters(
      elements.states,
      platform.components,
      elements.components
    );

    elements.choiceStates = getChoices(rawElements.choices);
    elements.transitions = labelTransitionParameters(
      elements.transitions,
      platform.components,
      elements.components
    );

    validateElements(elements, platform);
    return elements;
  } catch (error) {
    console.error(error);
    openImportError((error as any).message);
    return;
  }
}
