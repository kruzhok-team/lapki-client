// Модуль содержит функции, которые даунгрейдят машину состояний для общения с легаси API компилятора (для Берлоги)

import {
  CompilerInitialState,
  CompilerTransition,
  CompilerState,
  CompilerAction,
  CompilerElements,
  CompilerEvent,
} from '@renderer/types/CompilerTypes';
import {
  Transition,
  InitialState,
  Condition,
  Action,
  StateMachine,
  State,
  Event,
  ArgList,
  EventData,
} from '@renderer/types/diagram';

function downgradeArgs(argList: ArgList) {
  return Object.fromEntries(Object.keys(argList).map((id) => [id, argList[id].value.toString()]));
}

function downgradeActions(actions: string | Action[]): CompilerAction[] {
  if (typeof actions === 'string') {
    return [];
  }
  const compilerActions: CompilerAction[] = [];
  actions.map((value) => {
    compilerActions.push({ ...value, args: downgradeArgs(value.args ?? {}) });
  });

  return compilerActions;
}

function downgradeEvents(events: EventData[]): CompilerEvent[] {
  const compilerEvents: CompilerEvent[] = [];

  events.map((eventData) => {
    if (typeof eventData.trigger === 'string' || typeof eventData.condition === 'string') return;
    compilerEvents.push({
      ...eventData,
      trigger: eventData.trigger as CompilerAction,
      do: downgradeActions(eventData.do),
    });
  });

  return compilerEvents;
}

function downgradeInitialState(
  transitions: { [id: string]: Transition },
  id: string,
  initialState: InitialState
): CompilerInitialState {
  const target = Object.values(transitions).find((transition) => transition.sourceId === id);
  if (!target) throw Error('Отсутствует переход из начального состояния!');
  return {
    target: target.targetId,
    position: initialState.position,
  };
}

function downgradeTransitions(transitions: { [id: string]: Transition }): CompilerTransition[] {
  const downgradedTransitions: CompilerTransition[] = [];

  for (const transition of Object.values(transitions)) {
    if (
      !transition.label ||
      !transition.label.trigger ||
      typeof transition.label.trigger === 'string' ||
      typeof transition.label.condition === 'string'
    )
      continue;
    downgradedTransitions.push({
      source: transition.sourceId,
      target: transition.targetId,
      color: transition.color ?? '#FFFFFF',
      // TODO: Переводить в объект Condition если у нас включен текстовый режим
      condition: (transition.label?.condition as Condition) ?? null,
      trigger: transition.label.trigger as CompilerAction,
      do: downgradeActions((transition.label.do as Action[]) ?? []),
      position: transition.label.position,
    });
  }
  return downgradedTransitions;
}

function downgradeStates(states: { [id: string]: State }): { [id: string]: CompilerState } {
  const downgradedStates: { [id: string]: CompilerState } = {};
  for (const stateId in states) {
    const state = states[stateId];
    downgradedStates[stateId] = {
      name: state.name,
      bounds: {
        ...state.dimensions,
        ...state.position,
      },
      events: downgradeEvents(state.events),
      parent: state.parentId,
    };
  }

  return downgradedStates;
}

// Даунгрейд МС до уровня Берлоги и старой версии компилятора
export function downgradeStateMachine(sm: StateMachine): CompilerElements {
  const initialState = Object.entries(sm.initialStates).find(
    (value) => value[1].parentId === undefined
  );
  if (!initialState) throw Error('Отсутствует начальное состояние!');
  const downgradedInitialState = downgradeInitialState(
    sm.transitions,
    initialState[0],
    initialState[1]
  );
  const downgradedTransitions = downgradeTransitions(sm.transitions);
  const downgradedStates = downgradeStates(sm.states);

  return {
    states: downgradedStates,
    transitions: downgradedTransitions,
    initialState: downgradedInitialState,
    platform: sm.platform,
    components: sm.components,
    parameters: {},
  };
}
