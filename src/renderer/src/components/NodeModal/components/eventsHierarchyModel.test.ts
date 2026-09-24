import { describe, expect, it } from 'vitest';

import type { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { Component, Condition, EventData } from '@renderer/types/diagram';
import { Platform } from '@renderer/types/platform';

import {
  getActionText,
  getConditionText,
  getEventConflict,
  getTriggerText,
  getUsedSystemMethods,
  groupEventsByTrigger,
} from './eventsHierarchyModel';

const platformData: Platform = {
  id: 'test',
  compile: false,
  author: 'test',
  icon: '',
  formatVersion: '1',
  standardVersion: '1',
  staticComponents: false,
  delimeter: ';',
  version: '1',
  visual: true,
  staticActionDelimeter: '::',
  components: {
    Sensor: {
      name: 'Датчик',
      signals: { changed: { alias: 'Изменение' } },
      variables: { temperature: { alias: 'Температура' } },
      methods: { enable: { alias: 'Включить' } },
    },
  },
};

const platform = {
  data: platformData,
  resolveComponentType: (component: string) => component,
  getComponent: (component: string) =>
    component === 'System'
      ? {
          name: 'Общие',
          signals: {
            onEnter: { alias: 'Вход' },
            onExit: { alias: 'Выход' },
          },
          variables: {},
          methods: {},
        }
      : platformData.components[component],
} as PlatformManager;
const components: Record<string, Component> = {
  sensor1: {
    name: 'Датчик в комнате',
    type: 'Sensor',
    position: { x: 0, y: 0 },
    parameters: {},
    order: 0,
  },
};

const event = (trigger: EventData['trigger'], condition?: EventData['condition']): EventData => ({
  trigger,
  condition,
  do: [],
});

describe('events hierarchy model', () => {
  it('groups triggers by component, method and arguments while preserving source order', () => {
    const firstTrigger = {
      component: 'sensor1',
      method: 'changed',
      args: { value: { value: '1', order: 0 } },
    };
    const events = [
      event(firstTrigger),
      event({ ...firstTrigger, args: { value: { order: 0, value: '1' } } }),
      event({ ...firstTrigger, args: { value: { value: '2', order: 0 } } }),
      event(' customTrigger '),
      event('customTrigger'),
    ];

    const groups = groupEventsByTrigger(events);

    expect(groups.map((group) => group.events.map(({ eventIndex }) => eventIndex))).toEqual([
      [0, 1],
      [2],
      [3, 4],
    ]);
  });

  it('detects duplicate and mixed condition branches immediately', () => {
    const trigger = { component: 'sensor1', method: 'changed' };
    const condition: Condition = { type: 'value', value: 1 };

    expect(getEventConflict([event(trigger, condition)], undefined, { trigger, condition })).toBe(
      'duplicate-condition'
    );
    expect(getEventConflict([event(trigger)], undefined, { trigger, condition })).toBe(
      'mixed-condition'
    );
    expect(
      getEventConflict([event(' codeTrigger ', ' x > 1 ')], undefined, {
        trigger: 'codeTrigger',
        condition: 'x > 1',
      })
    ).toBe('duplicate-condition');
  });

  it('treats triggers with different arguments as different groups', () => {
    const existing = event({
      component: 'sensor1',
      method: 'changed',
      args: { value: { value: '1', order: 0 } },
    });
    const candidate = {
      trigger: {
        component: 'sensor1',
        method: 'changed',
        args: { value: { value: '2', order: 0 } },
      },
      condition: undefined,
    };

    expect(getEventConflict([existing], undefined, candidate)).toBeUndefined();
  });

  it('reserves system methods used by other events', () => {
    const events = [
      event({ component: 'System', method: 'onEnter' }),
      event({ component: 'System', method: 'onExit' }),
    ];

    expect(getUsedSystemMethods(events)).toEqual(['onEnter', 'onExit']);
    expect(getUsedSystemMethods(events, 0)).toEqual(['onExit']);
  });

  it('uses human-readable names with technical-name fallbacks', () => {
    const condition: Condition = {
      type: 'greater',
      value: [
        {
          type: 'component',
          value: { component: 'sensor1', method: 'temperature' },
        },
        { type: 'value', value: 10 },
      ],
    };

    expect(getTriggerText({ component: 'sensor1', method: 'changed' }, platform, components)).toBe(
      'Датчик в комнате.Изменение'
    );
    expect(getTriggerText({ component: 'System', method: 'onEnter' }, platform, components)).toBe(
      'Общие.Вход'
    );
    expect(getConditionText(condition, platform, components)).toBe(
      'Датчик в комнате.Температура > 10'
    );
    expect(getActionText({ component: 'sensor1', method: 'enable' }, platform, components)).toBe(
      'Датчик в комнате.Включить'
    );
    expect(getActionText({ component: 'missing', method: 'run' }, platform, components)).toBe(
      'missing.run'
    );
  });
});
