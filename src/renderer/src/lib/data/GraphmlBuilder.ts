import {
  CGMLElements,
  CGMLState,
  CGMLTransition,
  CGMLKeyNode,
  CGMLComponent,
  exportGraphml,
  emptyCGMLElements,
} from '@kruzhok-team/cyberiadaml-js';

import {
  ArgList,
  EventData,
  Elements,
  State,
  Action,
  Transition,
  Component,
  Event,
  Condition,
  Variable,
} from '@renderer/types/diagram';

import { isDefaultComponent, convertDefaultComponent } from './ElementsValidator';

// TODO: редактор мета-данных
function exportMeta(meta: string): string {
  return meta;
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

function serializeActions(actions: Action[]): string {
  let serialized = '';
  for (const action of actions) {
    serialized += `${action.component}.${action.method}(${serializeArgs(action.args)})\n`;
  }
  return serialized;
}

export function serializeEvents(events: EventData[]): string {
  let serialized = '';
  for (const event of events) {
    serialized += serializeEvent(event.trigger) + '/\n';
    serialized += serializeActions(event.do) + '\n';
  }
  return serialized;
}

function serializeStates(states: { [id: string]: State }): { [id: string]: CGMLState } {
  const cgmlStates: { [id: string]: CGMLState } = {};
  for (const id in states) {
    const state: State = states[id];
    cgmlStates[id] = {
      name: state.name,
      bounds: state.bounds,
      unsupportedDataNodes: [],
      actions: serializeEvents(state.events),
      parent: state.parent,
      color: state.color,
    };
  }
  return cgmlStates;
}

function serializeParameters(parameters: { [key: string]: string }): string {
  let serialized = '';
  for (const parameterName in parameters) {
    const parameterValue = parameters[parameterName];
    serialized += `${parameterName}/ ${parameterValue}\n`;
  }
  return serialized;
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
  return `[${lval} ${invertOperatorAlias[condition.type]} ${rval}]`;
}

function serializeTransitions(
  transitions: Record<string, Transition>
): Record<string, CGMLTransition> {
  const cgmlTransitions: Record<string, CGMLTransition> = {};
  for (const id in transitions) {
    const transition = transitions[id];
    const cgmlTransition: CGMLTransition = {
      id: id,
      source: transition.source,
      target: transition.target,
      unsupportedDataNodes: [],
      color: transition.color,
      position: transition.position,
    };
    const actions = transition.do ? serializeActions(transition.do) : undefined;
    const trigger = serializeEvent(transition.trigger);
    cgmlTransition.actions = trigger;
    if (transition.condition) {
      cgmlTransition.actions += serializeCondition(transition.condition);
    }
    cgmlTransition.actions += '/\n';
    if (actions !== undefined) {
      cgmlTransition.actions += actions;
    }
    cgmlTransition.actions.trim();
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

function serializeComponents(components: { [id: string]: Component }): {
  [id: string]: CGMLComponent;
} {
  const cgmlComponents: {
    [id: string]: CGMLComponent;
  } = {};
  for (const id in components) {
    const component = components[id];
    cgmlComponents[id] = {
      transitionId: component.transitionId,
      id: id,
      parameters: `type/ ${component.type}\n` + serializeParameters(component.parameters),
    };
  }
  return cgmlComponents;
}

export function exportCGML(elements: Elements): string {
  const cgmlElements: CGMLElements = emptyCGMLElements();
  cgmlElements.meta = exportMeta('');
  cgmlElements.format = 'Cyberiada-GraphML';
  cgmlElements.platform = elements.platform;
  if (elements.platform.startsWith('Arduino')) {
    cgmlElements.components = serializeComponents(elements.components);
  }
  cgmlElements.states = serializeStates(elements.states);
  cgmlElements.transitions = serializeTransitions(elements.transitions);
  if (elements.initialState !== null) {
    cgmlElements.initialState = {
      transitionId: 'initTransition',
      id: 'init',
      ...elements.initialState,
    };
  }
  cgmlElements.notes = elements.notes;
  cgmlElements.keys = getKeys();
  return exportGraphml(cgmlElements);
}
