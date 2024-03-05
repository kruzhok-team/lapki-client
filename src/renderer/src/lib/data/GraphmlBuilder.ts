import {
  CGMLElements,
  CGMLState,
  CGMLTransition,
  CGMLKeyNode,
  CGMLComponent,
  exportGraphml,
} from '@kruzhok-team/cyberiadaml-js';

import {
  ArgList,
  EventData,
  InnerElements,
  State,
  Action,
  Transition,
  Component,
  Event,
} from '@renderer/types/diagram';

import { isDefaultComponent, convertDefaultComponent } from './ElementsValidator';

function emptyCGMLElements(): CGMLElements {
  return {
    states: {},
    transitions: [],
    components: {},
    initialState: null,
    platform: '',
    meta: '',
    format: '',
    keys: [],
    notes: {},
  };
}

// TODO: редактор мета-данных
function exportMeta(meta: string): string {
  return meta;
}

function deserializeArgs(args: ArgList | undefined) {
  if (args === undefined) {
    return '';
  }
  return Object.values(args).join(', ');
}

function deserializeEvent(trigger: Event): string {
  if (isDefaultComponent(trigger)) {
    return convertDefaultComponent(trigger.component, trigger.method);
  }

  if (trigger.args === undefined) {
    return `${trigger.component}.${trigger.method}`;
  } else {
    return `${trigger.component}.${trigger.method}(${deserializeArgs(trigger.args)})`;
  }
}

function deserializeActions(actions: Action[]): string {
  let deserialized = '';
  for (const action of actions) {
    deserialized += `${action.component}.${action.method}(${deserializeArgs(action.args)})\n`;
  }
  return deserialized;
}

export function deserializeEvents(events: EventData[]): string {
  let deserialized = '';
  for (const event of events) {
    deserialized += deserializeEvent(event.trigger) + '/\n';
    deserialized += deserializeActions(event.do) + '\n';
  }
  return deserialized;
}

function deserializeStates(states: { [id: string]: State }): { [id: string]: CGMLState } {
  const cgmlStates: { [id: string]: CGMLState } = {};
  for (const id in states) {
    const state: State = states[id];
    cgmlStates[id] = {
      name: state.name,
      bounds: state.bounds,
      unsupportedDataNodes: [],
      actions: deserializeEvents(state.events),
      parent: state.parent,
    };
  }
  return cgmlStates;
}

function deserializeParameters(parameters: { [key: string]: string }): string {
  let deserialized = '';
  for (const parameterName in parameters) {
    const parameterValue = parameters[parameterName];
    deserialized += `${parameterName}/ ${parameterValue}\n`;
  }
  return deserialized;
}

function deserializeTransitions(transitions: Record<string, Transition>): CGMLTransition[] {
  const cgmlTransitions: CGMLTransition[] = [];
  for (const transition of Object.values(transitions)) {
    const cgmlTransition: CGMLTransition = {
      source: transition.source,
      target: transition.target,
      unsupportedDataNodes: [],
      color: transition.color,
      position: transition.position,
    };
    if (transition.do !== undefined) {
      cgmlTransition.actions =
        deserializeEvent(transition.trigger) + '/\n' + deserializeActions(transition.do);
    }
    cgmlTransitions.push(cgmlTransition);
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

function deserializeComponents(components: { [id: string]: Component }): {
  [id: string]: CGMLComponent;
} {
  const cgmlComponents: {
    [id: string]: CGMLComponent;
  } = {};
  for (const id in components) {
    const component = components[id];
    cgmlComponents[id] = {
      id: id,
      parameters: deserializeParameters(component.parameters),
    };
  }
  return cgmlComponents;
}

export function exportCGML(elements: InnerElements): string {
  const cgmlElements: CGMLElements = emptyCGMLElements();
  cgmlElements.meta = exportMeta('');
  cgmlElements.format = 'Cyberiada-GraphML';
  cgmlElements.platform = elements.platform;
  if (elements.platform.startsWith('Arduino')) {
    cgmlElements.components = deserializeComponents(elements.components);
  }
  cgmlElements.states = deserializeStates(elements.states);
  cgmlElements.transitions = deserializeTransitions(elements.transitions);
  if (elements.initialState !== null) {
    cgmlElements.initialState = {
      id: 'init',
      ...elements.initialState,
    };
    cgmlElements.transitions.push({
      source: 'init',
      target: elements.initialState.target,
      unsupportedDataNodes: [],
    });
  }
  cgmlElements.notes = elements.notes;
  cgmlElements.keys = getKeys();
  return exportGraphml(cgmlElements);
}
