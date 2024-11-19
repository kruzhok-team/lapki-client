// Модуль актуализирует машины состояний, пришедших с легаси API компилятора

import { generateId } from '@renderer/lib/utils';
import {
  CompilerTransition,
  CompilerInitialState,
  CompilerElements,
  CompilerState,
  CompilerComponent,
} from '@renderer/types/CompilerTypes';
import { Component, Elements, InitialState, State, Transition } from '@renderer/types/diagram';

function actualizeTransitions(oldTransitions: CompilerTransition[]): {
  [key: string]: Transition;
} {
  const newTransitions: {
    [key: string]: Transition;
  } = {};
  for (const oldTransition of oldTransitions) {
    newTransitions[generateId()] = {
      sourceId: oldTransition.source,
      targetId: oldTransition.target,
      color: oldTransition.color,
      label: {
        trigger: oldTransition.trigger,
        position: oldTransition.position,
        condition: oldTransition.condition,
        do: oldTransition.do,
      },
    };
  }
  return newTransitions;
}

function actualizeStates(oldStates: { [id: string]: CompilerState }): { [id: string]: State } {
  const states: { [id: string]: State } = {};
  for (const oldStateId in oldStates) {
    const oldState = oldStates[oldStateId];
    states[oldStateId] = {
      dimensions: {
        width: oldState.bounds.width,
        height: oldState.bounds.height,
      },
      position: {
        x: oldState.bounds.x,
        y: oldState.bounds.y,
      },
      name: oldState.name,
      parentId: oldState.parent,
      events: oldState.events,
    };
  }
  return states;
}

function actualizeInitialState(
  oldInitial: CompilerInitialState
): [{ [id: string]: InitialState }, { [id: string]: Transition }] {
  const initialId = generateId();
  const transitionId = generateId();
  const transition: Transition = {
    sourceId: initialId,
    targetId: oldInitial.target,
  };
  const initial: InitialState = {
    position: oldInitial.position,
    dimensions: { width: 50, height: 50 },
  };
  return [{ [initialId]: initial }, { [transitionId]: transition }];
}

function actualizeComponents(oldComponents: { [id: string]: CompilerComponent }): {
  [id: string]: Component;
} {
  const components: {
    [id: string]: Component;
  } = {};
  let orderComponent = 0;
  for (const oldComponentId in oldComponents) {
    const oldComponent = oldComponents[oldComponentId];
    components[oldComponentId] = {
      ...oldComponent,
      order: orderComponent,
    };
    orderComponent += 1;
  }

  return components;
}

export function actualizeElements(oldElements: CompilerElements): Elements {
  const [initials, initialTransition] = actualizeInitialState(oldElements.initialState);
  return {
    parameters: oldElements.parameters,
    stateMachines: {
      G: {
        visual: true,
        position: { x: 0, y: 0 },
        platform: oldElements.platform,
        components: actualizeComponents(oldElements.components),
        states: actualizeStates(oldElements.states),
        finalStates: {},
        choiceStates: {},
        notes: {},
        transitions: {
          ...actualizeTransitions(oldElements.transitions),
          ...initialTransition,
        },
        initialStates: initials,
        meta: {},
      },
    },
  };
}
