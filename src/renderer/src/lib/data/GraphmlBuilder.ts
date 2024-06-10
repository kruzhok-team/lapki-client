import {
  CGMLElements,
  CGMLState,
  CGMLTransition,
  CGMLKeyNode,
  CGMLComponent,
  exportGraphml,
  emptyCGMLElements,
  CGMLMeta,
  CGMLAction,
  CGMLTransitionAction,
  CGMLVertex,
  CGMLNote,
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

import { isDefaultComponent, convertDefaultComponent } from './ElementsValidator';

import { ChoiceState } from '../drawable';

function exportMeta(meta: Meta, platform: Platform): CGMLMeta {
  return {
    id: 'coreMeta',
    values: {
      ...meta,
      standardVersion: platform.standardVersion,
      platformVersion: platform.version,
    },
  };
}

function serializeArgs(args: ArgList | undefined) {
  if (args === undefined) {
    return '';
  }
  return Object.values(args).join(', ');
}

function serializeEvent(trigger: Event): string {
  if (isDefaultComponent(trigger)) {
    return convertDefaultComponent(trigger.component, trigger.method);
  }

  if (trigger.args === undefined) {
    return `${trigger.component}.${trigger.method}`;
  } else {
    return `${trigger.component}.${trigger.method}(${serializeArgs(trigger.args)})`;
  }
}

function serializeActions(
  actions: Action[],
  components: { [id: string]: Component },
  platform: Platform
): string {
  let serialized = '';
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

export function serializeTransitionEvents(
  doActions: Action[] | undefined,
  trigger: Event | undefined,
  condition: null | undefined | Condition,
  platform: Platform,
  components: { [id: string]: Component }
): CGMLTransitionAction[] {
  return [
    {
      trigger: {
        event: trigger ? serializeEvent(trigger) : undefined,
        condition: condition ? serializeCondition(condition) : undefined,
      },
      action: doActions ? serializeActions(doActions, components, platform) : undefined,
    },
  ];
}

export function serializeStateEvents(
  events: EventData[],
  platform: Platform,
  components: { [id: string]: Component }
): CGMLAction[] {
  const serializedActions: CGMLAction[] = [];
  for (const event of events) {
    serializedActions.push({
      trigger: {
        event: serializeEvent(event.trigger),
      },
      action: serializeActions(event.do, components, platform),
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

function getOperand(operand: string | number | Variable | Condition[]): string | number {
  if (isConditionArray(operand)) {
    throw new Error('Internal error: operand is Condition[]');
  }
  if (isVariable(operand)) {
    return `${operand.component}.${operand.method}`;
  }
  return operand;
}

function serializeCondition(condition: Condition): string {
  if (!isConditionArray(condition.value)) {
    throw new Error('Internal error: condition.value is not Condition[];');
  }
  const lval = getOperand(condition.value[0].value);
  const rval = getOperand(condition.value[1].value);
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
      source: transition.source,
      target: transition.target,
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
      platform,
      components
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
    };
  }
  return cgmlNotes;
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
    };
  }
  return cgmlComponents;
}

export function exportCGML(elements: Elements): string {
  const platform = getPlatform(elements.platform);
  if (!platform) {
    throw new Error('Внутренняя ошибка! В момент экспорта схемы платформа не инициализирована.');
  }
  const cgmlElements: CGMLElements = emptyCGMLElements();
  cgmlElements.meta = exportMeta(elements.meta, platform);
  cgmlElements.format = 'Cyberiada-GraphML-1.0';
  cgmlElements.platform = elements.platform;
  if (elements.platform.startsWith('Arduino')) {
    cgmlElements.components = serializeComponents(elements.components);
  }
  cgmlElements.states = serializeStates(elements.states, platform, elements.components);
  cgmlElements.transitions = serializeTransitions(
    elements.transitions,
    platform,
    elements.components
  );
  cgmlElements.notes = serializeNotes(elements.notes);
  cgmlElements.initialStates = serializeVertex(elements.initialStates, 'initial');
  cgmlElements.finals = serializeVertex(elements.finalStates, 'final');
  cgmlElements.choices = serializeVertex(elements.choiceStates, 'choice');
  cgmlElements.keys = getKeys();
  return exportGraphml(cgmlElements);
}
