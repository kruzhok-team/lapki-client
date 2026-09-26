import { isEqual } from 'lodash';

import type { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { Action, Component, Condition, Event, EventData, Variable } from '@renderer/types/diagram';

export type IndexedEvent = {
  event: EventData;
  eventIndex: number;
};

export type EventGroup = {
  trigger: EventData['trigger'];
  events: IndexedEvent[];
};

export type EventConflict = 'duplicate-system-trigger' | 'duplicate-condition' | 'mixed-condition';

const operatorLabels: Record<string, string> = {
  equals: '==',
  notEquals: '!=',
  greater: '>',
  less: '<',
  greaterOrEqual: '>=',
  lessOrEqual: '<=',
};

const normalizeText = (value: string) => value.trim();

export const areTriggersEqual = (left: EventData['trigger'], right: EventData['trigger']) => {
  if (typeof left === 'string' || typeof right === 'string') {
    return typeof left === 'string' && typeof right === 'string'
      ? normalizeText(left) === normalizeText(right)
      : false;
  }
  return isEqual(left, right);
};

export const areConditionsEqual = (left: EventData['condition'], right: EventData['condition']) => {
  if (typeof left === 'string' || typeof right === 'string') {
    return typeof left === 'string' && typeof right === 'string'
      ? normalizeText(left) === normalizeText(right)
      : false;
  }
  return isEqual(left, right);
};

const hasCondition = (condition: EventData['condition']) =>
  typeof condition === 'string' ? normalizeText(condition).length > 0 : condition !== undefined;

export const groupEventsByTrigger = (events: EventData[]): EventGroup[] => {
  const groups: EventGroup[] = [];

  events.forEach((event, eventIndex) => {
    const group = groups.find(({ trigger }) => areTriggersEqual(trigger, event.trigger));
    const indexedEvent = { event, eventIndex };
    if (group) {
      group.events.push(indexedEvent);
    } else {
      groups.push({ trigger: event.trigger, events: [indexedEvent] });
    }
  });

  return groups;
};

export const getEventConflict = (
  events: EventData[],
  currentEventIndex: number | undefined,
  candidate: Pick<EventData, 'trigger' | 'condition'>
): EventConflict | undefined => {
  for (const [eventIndex, event] of events.entries()) {
    if (eventIndex === currentEventIndex) continue;

    if (
      typeof candidate.trigger !== 'string' &&
      candidate.trigger.component === 'System' &&
      typeof event.trigger !== 'string' &&
      event.trigger.component === 'System' &&
      event.trigger.method === candidate.trigger.method
    ) {
      return 'duplicate-system-trigger';
    }

    if (!areTriggersEqual(event.trigger, candidate.trigger)) continue;
    if (areConditionsEqual(event.condition, candidate.condition)) return 'duplicate-condition';
    if (hasCondition(event.condition) !== hasCondition(candidate.condition))
      return 'mixed-condition';
  }

  return undefined;
};

export const getUsedSystemMethods = (events: EventData[], currentEventIndex?: number) =>
  events.flatMap((event, eventIndex) => {
    if (eventIndex === currentEventIndex || typeof event.trigger === 'string') return [];
    return event.trigger.component === 'System' ? [event.trigger.method] : [];
  });

const getComponentName = (
  componentId: string,
  platform: PlatformManager,
  components: Record<string, Component>
) => {
  if (componentId === 'System') return platform.getComponent('System')?.name ?? componentId;
  return components[componentId]?.name ?? componentId;
};

const getComponentProto = (
  componentId: string,
  platform: PlatformManager,
  components: Record<string, Component>
) => {
  if (componentId === 'System') return platform.getComponent('System');
  const componentType = components[componentId]?.type ?? platform.resolveComponentType(componentId);
  return platform.data.components[componentType];
};

const getVariableText = (
  variable: Variable,
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable: boolean
) => {
  const componentName = humanReadable
    ? getComponentName(variable.component, platform, components)
    : variable.component;
  const proto = getComponentProto(variable.component, platform, components);
  const variableName =
    humanReadable && proto?.variables[variable.method]?.alias
      ? proto.variables[variable.method].alias
      : variable.method;
  return `${componentName}.${variableName}`;
};

const getArgumentText = (
  value: unknown,
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable: boolean
) => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'component' in value &&
    'method' in value
  ) {
    return getVariableText(value as Variable, platform, components, humanReadable);
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value ?? '');
};

const getArgsText = (
  args: Event['args'],
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable: boolean
) => {
  if (!args || Object.keys(args).length === 0) return '';
  const values = Object.values(args)
    .sort((left, right) => left.order - right.order)
    .map(({ value }) => getArgumentText(value, platform, components, humanReadable));
  return `(${values.join(', ')})`;
};

export const getTriggerText = (
  trigger: EventData['trigger'],
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable = true
) => {
  if (typeof trigger === 'string') return normalizeText(trigger);
  const componentName = humanReadable
    ? getComponentName(trigger.component, platform, components)
    : trigger.component;
  const proto = getComponentProto(trigger.component, platform, components);
  const methodName =
    humanReadable && proto?.signals[trigger.method]?.alias
      ? proto.signals[trigger.method].alias
      : trigger.method;
  return `${componentName}.${methodName}${getArgsText(
    trigger.args,
    platform,
    components,
    humanReadable
  )}`;
};

const getConditionPartText = (
  condition: Condition,
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable: boolean
): string => {
  if (condition.type === 'component' && !Array.isArray(condition.value)) {
    return getVariableText(condition.value as Variable, platform, components, humanReadable);
  }
  if (condition.type === 'value') return String(condition.value);
  if (Array.isArray(condition.value) && condition.value.length === 2) {
    const left = getConditionPartText(condition.value[0], platform, components, humanReadable);
    const right = getConditionPartText(condition.value[1], platform, components, humanReadable);
    return `${left} ${operatorLabels[condition.type] ?? condition.type} ${right}`;
  }
  return JSON.stringify(condition.value);
};

export const getConditionText = (
  condition: EventData['condition'],
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable = true
) => {
  if (!condition || (typeof condition === 'string' && !normalizeText(condition))) {
    return '[Без условия]';
  }
  if (typeof condition === 'string') return `[${normalizeText(condition)}]`;
  return `[${getConditionPartText(condition, platform, components, humanReadable)}]`;
};

export const getActionText = (
  action: Action,
  platform: PlatformManager,
  components: Record<string, Component>,
  humanReadable = true
) => {
  const componentName = humanReadable
    ? getComponentName(action.component, platform, components)
    : action.component;
  const proto = getComponentProto(action.component, platform, components);
  const methodName =
    humanReadable && proto?.methods[action.method]?.alias
      ? proto.methods[action.method].alias
      : action.method;
  return `${componentName}.${methodName}`;
};
