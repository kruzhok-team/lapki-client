import {
  CGMLElements,
  CGMLState,
  CGMLTransition,
  CGMLKeyNode,
  CGMLComponent,
  exportGraphml,
  createEmptyElements,
  CGMLMeta,
  CGMLAction,
  CGMLTransitionAction,
  CGMLVertex,
  CGMLNote,
  CGMLDataNode,
  serializeActions as serializeActionsCGML,
} from '@kruzhok-team/cyberiadaml-js';

import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import {
  ArgList,
  EventData,
  Elements,
  State,
  Action,
  Transition,
  Component,
  Event,
  Meta,
  Condition,
  Variable,
  InitialState,
  FinalState,
  Note,
} from '@renderer/types/diagram';
import { Platform } from '@renderer/types/platform';
import { isString } from '@renderer/utils';

import { isDefaultComponent, convertDefaultComponent } from './ElementsValidator';

import { ChoiceState } from '../drawable';
import { Point } from '../types';

function exportMeta(visual: boolean, meta: Meta, platform: Platform): CGMLMeta {
  return {
    id: 'coreMeta',
    values: {
      ...meta,
      standardVersion: platform.standardVersion,
      platformVersion: platform.version,
      lapkiVisual: visual.toString(),
    },
  };
}

function serializeArgs(args: ArgList | undefined) {
  if (args === undefined) {
    return '';
  }
  return Object.values(args).join(', ');
}

/**
 * Формирует текстовую форму пиктографического триггера события.
 * @param trigger Данные триггера
 * @returns Строка с сериализованным триггером
 */
export function serializeEvent(trigger: Event): string {
  if (isDefaultComponent(trigger)) {
    return convertDefaultComponent(trigger.component, trigger.method);
  }

  if (trigger.args === undefined) {
    return `${trigger.component}.${trigger.method}`;
  } else {
    return `${trigger.component}.${trigger.method}(${serializeArgs(trigger.args)})`;
  }
}

function getActionDelimeter(platform: Platform, componentType: string): string {
  const platformComponent = platform.components[componentType];
  const isArduino = platform.name?.startsWith('Arduino');
  return platformComponent.singletone && isArduino ? '::' : '.';
}

/**
 * Формирует строковую форму пиктографического поведения (набора действий)
 * @param actions Список пиктографических действий
 * @param components Описание компонентов
 * @param platform Текущая платформа
 * @returns Строка с сериализованной формой
 */
export function serializeActions(
  actions: Action[],
  components: { [id: string]: Component },
  platform: Platform
): string {
  let serialized = '';
  // TODO: Стиль команд, внедрить новый формат платформ
  const isArduino = platform.name?.startsWith('Arduino');
  const delimeter = isArduino ? ';' : '';
  for (const action of actions) {
    const component = components[action.component];
    const platformComponent = platform.components[component.type];
    const actionDelimeter = platformComponent.singletone && isArduino ? '::' : '.';
    serialized += `${action.component}${actionDelimeter}${action.method}(${serializeArgs(
      action.args
    )})${delimeter}\n`;
  }
  return serialized.trim();
}

function getTrigger(trigger: Event | string | undefined): string | undefined {
  if (!trigger) {
    return undefined;
  }
  return isString(trigger) ? trigger : serializeEvent(trigger);
}

function getActions(
  actions: Action[] | string | undefined,
  components: { [id: string]: Component },
  platform: Platform
): string | undefined {
  if (!actions) {
    return undefined;
  }
  return isString(actions) ? actions : serializeActions(actions, components, platform);
}

function getCondition(
  condition: null | undefined | string | Condition,
  platform: Platform,
  components: { [id: string]: Component }
): string | undefined {
  if (!condition) {
    return undefined;
  }
  return isString(condition) ? condition : serializeCondition(condition, platform, components);
}

function serializeTransitionEvents(
  doActions: Action[] | string | undefined,
  trigger: Event | string | undefined,
  condition: null | undefined | string | Condition,
  components: { [id: string]: Component },
  platform: Platform
): CGMLTransitionAction[] {
  return [
    {
      trigger: {
        event: getTrigger(trigger),
        condition: getCondition(condition, platform, components),
      },
      action: getActions(doActions, components, platform),
    },
  ];
}

function serializeStateEvents(
  events: EventData[],
  platform: Platform,
  components: { [id: string]: Component }
): CGMLAction[] {
  const serializedActions: CGMLAction[] = [];
  for (const event of events) {
    serializedActions.push({
      trigger: {
        event: getTrigger(event.trigger) ?? '',
        condition: getCondition(event.condition, platform, components),
      },
      action: getActions(event.do, components, platform),
    });
  }
  return serializedActions;
}

function serializeStates(
  states: { [id: string]: State },
  platform: Platform,
  components: { [id: string]: Component }
): { [id: string]: CGMLState } {
  const cgmlStates: { [id: string]: CGMLState } = {};
  for (const id in states) {
    const state: State = states[id];
    cgmlStates[id] = {
      name: state.name,
      unsupportedDataNodes: [],
      actions: serializeStateEvents(state.events, platform, components),
      parent: state.parentId,
      color: state.color,
      bounds: {
        ...state.position,
        ...state.dimensions,
      },
    };
  }
  return cgmlStates;
}

const invertOperatorAlias = {
  equals: '==',
  notEquals: '!=',
  greater: '>',
  less: '<',
  greaterOrEqual: '>=',
  lessOrEqual: '<=',
};

function isVariable(operand: any): operand is Variable {
  return operand.component !== undefined;
}

function isConditionArray(value: unknown): value is Condition[] {
  return Array.isArray(value);
}

function getOperand(
  operand: string | number | Variable | Condition[],
  platform: Platform,
  components: { [id: string]: Component }
): string | number {
  if (isConditionArray(operand)) {
    throw new Error('Internal error: operand is Condition[]');
  }
  if (isVariable(operand)) {
    const component = components[operand.component];
    return `${operand.component}${getActionDelimeter(platform, component.type)}${operand.method}`;
  }
  return operand;
}

/**
 * Формирует текстовую форму пиктографического условия события.
 * @param condition Данные условия
 * @param platform Используемая платформа
 * @param components Текущие компоненты
 * @returns Строка с сериализованным условием
 */
export function serializeCondition(
  condition: Condition,
  platform: Platform,
  components: { [id: string]: Component }
): string {
  if (!isConditionArray(condition.value)) {
    throw new Error('Internal error: condition.value is not Condition[];');
  }
  const lval = getOperand(condition.value[0].value, platform, components);
  const rval = getOperand(condition.value[1].value, platform, components);
  return `${lval} ${invertOperatorAlias[condition.type]} ${rval}`;
}

type Vertex = FinalState | ChoiceState | InitialState;
type VertexType = 'final' | 'initial' | 'choice';

function serializeVertex(
  vertexes: { [id: string]: Vertex },
  vertexType: VertexType
): { [id: string]: CGMLVertex } {
  const rawVertexes: { [id: string]: CGMLVertex } = {};
  for (const vertexId in vertexes) {
    const vertex: Vertex = vertexes[vertexId];
    rawVertexes[vertexId] = {
      data: '',
      type: vertexType,
      position: vertex.position,
    };
    if (vertex['parentId']) {
      rawVertexes[vertexId].parent = vertex['parentId'];
    }
  }
  return rawVertexes;
}

function serializeTransitions(
  transitions: Record<string, Transition>,
  platform: Platform,
  components: { [id: string]: Component }
): Record<string, CGMLTransition> {
  const cgmlTransitions: Record<string, CGMLTransition> = {};
  for (const id in transitions) {
    const transition = transitions[id];
    const cgmlTransition: CGMLTransition = {
      id: id,
      source: transition.sourceId,
      target: transition.targetId,
      pivot: undefined,
      unsupportedDataNodes: [],
      color: transition.color,
      labelPosition: transition.label?.position,
      actions: [],
    };
    if (transition.label === undefined) {
      cgmlTransitions[id] = cgmlTransition;
      continue;
    }
    cgmlTransition.actions = serializeTransitionEvents(
      transition.label.do,
      transition.label.trigger,
      transition.label.condition,
      components,
      platform
    );
    cgmlTransitions[id] = cgmlTransition;
  }
  return cgmlTransitions;
}

function getKeys(): CGMLKeyNode[] {
  return [
    {
      id: 'dName',
      for: 'node',
      'attr.name': 'name',
      'attr.type': 'string',
    },
    {
      id: 'dData',
      for: 'node',
      'attr.name': 'data',
      'attr.type': 'string',
    },
    {
      id: 'dData',
      for: 'edge',
      'attr.name': 'data',
      'attr.type': 'string',
    },
    {
      id: 'dInitial',
      for: 'node',
      'attr.name': 'initial',
      'attr.type': 'string',
    },
    {
      id: 'dGeometry',
      for: 'edge',
    },
    {
      id: 'dGeometry',
      for: 'node',
    },
    {
      id: 'dColor',
      for: 'edge',
    },
    {
      id: 'dNote',
      for: 'node',
    },
    {
      id: 'dColor',
      for: 'node',
    },
  ];
}

function serializeNotes(notes: { [id: string]: Note }): { [id: string]: CGMLNote } {
  const cgmlNotes: { [id: string]: CGMLNote } = {};
  for (const noteId in notes) {
    const note = notes[noteId];
    cgmlNotes[noteId] = {
      name: undefined,
      text: note.text,
      position: note.position,
      type: 'informal',
      unsupportedDataNodes: [],
    };
  }
  return cgmlNotes;
}

function getPointNode(position: Point): CGMLDataNode {
  return {
    key: 'dLapkiSchemePosition',
    content: '',
    point: [
      {
        ...position,
      },
    ],
    rect: undefined,
  };
}

function serializeComponents(components: { [id: string]: Component }): {
  [id: string]: CGMLComponent;
} {
  const cgmlComponents: {
    [id: string]: CGMLComponent;
  } = {};
  for (const id in components) {
    const component = components[id];
    cgmlComponents[`c${id}`] = {
      id: id,
      type: component.type,
      parameters: component.parameters,
      order: component.order,
      unsupportedDataNodes: [getPointNode(component.position)],
    };
  }
  return cgmlComponents;
}

export function exportCGML(elements: Elements): string {
  const cgmlElements: CGMLElements = createEmptyElements();
  for (const smId in elements.stateMachines) {
    if (smId === '') continue;
    const sm = elements.stateMachines[smId];
    const platform = getPlatform(sm.platform);
    if (!platform) {
      throw new Error('Внутренняя ошибка! В момент экспорта схемы платформа не инициализирована.');
    }
    cgmlElements.meta = exportMeta(sm.visual, sm.meta, platform);
    cgmlElements.format = 'Cyberiada-GraphML-1.0';
    cgmlElements.platform = sm.platform;
    cgmlElements.stateMachines[smId] = {
      components: sm.platform.startsWith('Arduino') ? serializeComponents(sm.components) : {},
      states: serializeStates(sm.states, platform, sm.components),
      transitions: serializeTransitions(sm.transitions, platform, sm.components),
      notes: serializeNotes(sm.notes),
      initialStates: serializeVertex(sm.initialStates, 'initial'),
      finals: serializeVertex(sm.finalStates, 'final'),
      choices: serializeVertex(sm.choiceStates, 'choice'),
      terminates: {},
      unknownVertexes: {},
    };
  }
  cgmlElements.keys = getKeys();
  return exportGraphml(cgmlElements);
}

export function serializeTransitionActions(
  label: Exclude<Transition['label'], undefined>,
  platform: Platform,
  components: { [id: string]: Component }
) {
  const cgmlData = serializeTransitionEvents(
    label.do,
    label.trigger,
    label.condition,
    components,
    platform
  );
  return serializeActionsCGML(cgmlData).trim();
}

export function serializeStateActions(
  events: State['events'],
  platform: Platform,
  components: { [id: string]: Component }
) {
  const cgmlData = serializeStateEvents(events, platform, components);
  return serializeActionsCGML(cgmlData).trim();
}
