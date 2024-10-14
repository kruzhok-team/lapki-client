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
  CGMLMeta,
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
  emptyElements,
  emptyStateMachine,
} from '@renderer/types/diagram';
import { Platform, ComponentProto, MethodProto, SignalProto } from '@renderer/types/platform';
import { isString } from '@renderer/utils';

import { validateElements } from './ElementsValidator';
import { getPlatform, isPlatformAvailable } from './PlatformLoader';

import { Point } from '../types';

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

const pictoRegex: RegExp = /.+(\.|::).+\(.*\)/;

function parseAction(unproccessedAction: string): Action | undefined | string {
  if (unproccessedAction === '') {
    return undefined;
  }
  const regResult = pictoRegex.exec(unproccessedAction);
  if (!regResult) {
    return unproccessedAction;
  }
  const getAction = (delimeter: string, reserveDelimeter: string) => {
    const trimed = unproccessedAction.trim();
    const firstSplit = trimed.split(delimeter);
    if (firstSplit.length > 1) {
      return firstSplit;
    }
    const secondSplit = trimed.split(reserveDelimeter);
    return secondSplit;
  };
  let [componentName, action] = getAction('.', '::');

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

function parseActions(unsplitedActions: string): Action[] | string | undefined {
  if (unsplitedActions === '') {
    return;
  }
  // Считаем, что действия находятся на разных строках
  const actions = unsplitedActions.split('\n');
  const resultActions: Action[] = [];
  for (const unprocessedAction of actions) {
    const resultAction = parseAction(unprocessedAction);
    if (isString(resultAction)) {
      return unsplitedActions;
    }
    if (resultAction) resultActions.push(resultAction);
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
      dimensions: { width: 100, height: 50 },
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
      dimensions: { width: 100, height: 50 },
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
      dimensions: { width: 100, height: 50 },
    };
  }
  return choices;
}

function getStates(rawStates: { [id: string]: CGMLState }): [boolean, { [id: string]: State }] {
  const states: { [id: string]: State } = {};
  let visual = true;
  for (const rawStateId in rawStates) {
    const rawState = rawStates[rawStateId];
    const [isVisual, events] = actionsToEventData(rawState.actions);
    // FIXME: здесь нужно пробросить предупреждение о переходе в тестовый режим
    if (!isVisual) {
      visual = false;
    }
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
  return [visual, states];
}

function actionsToEventData(
  rawActions: Array<CGMLAction | CGMLTransitionAction>
): [boolean, EventData[]] {
  const eventDataArr: EventData[] = [];
  let visual = true;
  for (const action of rawActions) {
    const eventData: EventData = {
      trigger: {
        component: '',
        method: '',
      },
      do: [],
    };
    if (action.action) {
      const parsedActions = parseActions(action.action);
      if (parsedActions && !Array.isArray(parsedActions)) {
        // FIXME: здесь нужно пробросить предупреждение о переходе в тестовый режим
        visual = false;
      }
      if (parsedActions) {
        eventData.do = parsedActions;
      }
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
  return [visual, eventDataArr];
}

function getTransitions(
  rawTransitions: Record<string, CGMLTransition>
): [boolean, Record<string, Transition>] {
  const transitions: Record<string, Transition> = {};
  let visual = true;
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
    const [isVisual, eventData] = actionsToEventData(rawTransition.actions);
    if (!isVisual) {
      visual = isVisual;
    }
    transitions[id] = {
      sourceId: rawTransition.source,
      targetId: rawTransition.target,
      color: rawTransition.color,
      label: {
        position: rawTransition.labelPosition ?? { x: -1, y: -1 },
        trigger: eventData[0].trigger,
        do: eventData[0].do,
        condition: eventData[0].condition,
      },
    };
  }
  return [visual, transitions];
}

function getComponentPosition(rawComponent: CGMLComponent): Point {
  const node = rawComponent.unsupportedDataNodes.find(
    (value) => value.key == 'dLapkiSchemePosition'
  );
  if (!node) {
    return {
      x: 0,
      y: 0,
    };
  }
  if (!node.point) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x: +node.point[0].x,
    y: +node.point[0].y,
  };
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
      position: getComponentPosition(rawComponent),
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
      if (isString(event.do)) {
        continue;
      }
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
            event.do[actionIdx].args = labelParameters(action.args, method);
            labeledState.events[eventIdx] = event;
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
    if (isString(labeledTransition.label?.do)) {
      continue;
    }
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
      position: {
        x: 0,
        y: 0,
      }, // TODO (L140-beep): что-то нужно с этим придумать
      parameters: {},
      order: 0,
    };
  }
  return components;
}

function getVisualFlag(
  rawMeta: CGMLMeta,
  platformVisual: boolean,
  computedValue: boolean // Значение, которое выдал парсер после парсинга схемы
): boolean {
  const visual: boolean | undefined = rawMeta.values['lapkiVisual']
    ? rawMeta.values['lapkiVisual'] === 'true'
    : undefined;
  if (visual === undefined) {
    return platformVisual && computedValue;
  }
  if (visual && !platformVisual) {
    throw new Error(
      'В схеме флаг lapkiVisual равен true, но целевая платформа не поддерживает визуальный режим!'
    );
  }
  return visual;
}

export function importGraphml(
  expression: string,
  openImportError: (error: string) => void
): Elements | undefined {
  try {
    //Вот тут схема не отдает уже позицию компонентов.
    const rawElements: CGMLElements = parseCGML(expression);
    const elements: Elements = emptyElements();
    if (!isPlatformAvailable(rawElements.platform)) {
      throw new Error(`Неизвестная платформа ${rawElements.platform}.`);
    }

    // TODO: добавить в платформу флаг для статических компонентов
    const platform: Platform | undefined = getPlatform(rawElements.platform);
    if (platform === undefined) {
      throw new Error('Internal error: undefined getPlatform result, but platform is avaialble.');
    }
    for (const smId in rawElements.stateMachines) {
      const rawSm = rawElements.stateMachines[smId];
      const sm = emptyStateMachine();
      if (rawElements.platform.startsWith('Bearloga')) {
        sm.components = getAllComponent(platform.components);
      } else {
        sm.components = getComponents(rawSm.components);
      }
      sm.meta = rawElements.meta.values;
      sm.initialStates = getInitialStates(rawSm.initialStates);
      sm.finalStates = getFinals(rawSm.finals);
      sm.notes = rawSm.notes;
      const [stateVisual, states] = getStates(rawSm.states);
      sm.states = states;
      const [transitionVisual, transitions] = getTransitions(rawSm.transitions);
      sm.transitions = transitions;
      sm.states = labelStateParameters(sm.states, platform.components, sm.components);
      sm.platform = rawElements.platform;
      sm.choiceStates = getChoices(rawSm.choices);
      sm.transitions = labelTransitionParameters(
        sm.transitions,
        platform.components,
        sm.components
      );
      sm.visual = getVisualFlag(rawElements.meta, platform.visual, stateVisual && transitionVisual);
      elements.stateMachines[smId] = sm;
    }
    const platforms: { [id: string]: Platform } = {};
    platforms[rawElements.platform] = platform;
    validateElements(elements, platforms);
    return elements;
  } catch (error) {
    console.error(error);
    openImportError((error as any).message);
    return;
  }
}
