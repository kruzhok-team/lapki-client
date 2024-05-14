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

import { isDefaultComponent, convertDefaultComponent } from './ElementsValidator';

function exportMeta(meta: Meta): CGMLMeta {
  return {
    id: 'coreMeta',
    values: meta,
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

function serializeActions(actions: Action[]): string {
  let serialized = '';
  for (const action of actions) {
    serialized += `${action.component}.${action.method}(${serializeArgs(action.args)})\n`;
  }
  return serialized.trim();
}

export function serializeTransitionEvents(
  doActions: Action[] | undefined,
  trigger: Event | undefined,
  condition: null | undefined | Condition
): CGMLTransitionAction[] {
  return [
    {
      trigger: trigger ? serializeEvent(trigger) : undefined,
      condition: condition ? serializeCondition(condition) : undefined,
      action: doActions ? serializeActions(doActions) : undefined,
    },
  ];
}

export function serializeStateEvents(events: EventData[]): CGMLAction[] {
  const serializedActions: CGMLAction[] = [];
  for (const event of events) {
    serializedActions.push({
      trigger: serializeEvent(event.trigger),
      action: serializeActions(event.do),
    });
  }
  return serializedActions;
}

function serializeStates(states: { [id: string]: State }): { [id: string]: CGMLState } {
  const cgmlStates: { [id: string]: CGMLState } = {};
  for (const id in states) {
    const state: State = states[id];
    cgmlStates[id] = {
      name: state.name,
      unsupportedDataNodes: [],
      actions: serializeStateEvents(state.events),
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
  return `[${lval} ${invertOperatorAlias[condition.type]} ${rval}]`;
}

function serializeFinals(finalStates: { [id: string]: FinalState }): { [id: string]: CGMLVertex } {
  const finals: { [id: string]: CGMLVertex } = {};
  for (const finalId in finalStates) {
    const final = finalStates[finalId];
    finals[finalId] = {
      data: '',
      type: 'final',
      parent: final.parentId,
      position: final.position,
    };
  }
  return finals;
}

function serializeInitials(initialStates: { [id: string]: InitialState }): {
  [id: string]: CGMLVertex;
} {
  const initials: { [id: string]: CGMLVertex } = {};
  for (const initialId in initialStates) {
    const initial = initialStates[initialId];
    initials[initialId] = {
      data: '',
      type: 'initial',
      parent: initial.parentId,
      position: initial.position,
    };
  }
  return initials;
}

export function serializeTransitionActions(trigger: Event, actions: Action[]) {
  return (serializeEvent(trigger) + '/\n' + serializeActions(actions)).trim();
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
      transition.label.condition
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
  const cgmlElements: CGMLElements = emptyCGMLElements();
  cgmlElements.meta = exportMeta(elements.meta);
  cgmlElements.format = 'Cyberiada-GraphML';
  cgmlElements.platform = elements.platform;
  if (elements.platform.startsWith('Arduino')) {
    cgmlElements.components = serializeComponents(elements.components);
  }
  cgmlElements.states = serializeStates(elements.states);
  cgmlElements.transitions = serializeTransitions(elements.transitions);
  cgmlElements.notes = serializeNotes(elements.notes);
  cgmlElements.initialStates = serializeInitials(elements.initialStates);
  cgmlElements.finals = serializeFinals(elements.finalStates);
  cgmlElements.keys = getKeys();
  return exportGraphml(cgmlElements);
}
