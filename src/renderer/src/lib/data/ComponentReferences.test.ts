import { describe, expect, it } from 'vitest';

import { StateMachine } from '@renderer/types/diagram';
import { Platform } from '@renderer/types/platform';

import { getMissingComponentReferences } from './ComponentReferences';

const platform: Platform = {
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
    Device: { signals: {}, variables: {}, methods: {} },
  },
};

const machine = (): StateMachine => ({
  position: { x: 0, y: 0 },
  states: {},
  initialStates: {},
  finalStates: {},
  choiceStates: {},
  transitions: {},
  components: {
    device: {
      type: 'Device',
      position: { x: 0, y: 0 },
      parameters: {},
      order: 0,
    },
  },
  shallowHistory: {},
  notes: {},
  platform: platform.id,
  visual: true,
  meta: {},
});

describe('getMissingComponentReferences', () => {
  it('collects unique orphaned references from states and transitions', () => {
    const stateMachine = machine();
    stateMachine.states.state = {
      name: 'State',
      position: { x: 0, y: 0 },
      dimensions: { width: 100, height: 100 },
      events: [
        {
          trigger: { component: 'removedSensor', method: 'changed' },
          do: [
            {
              component: 'device',
              method: 'run',
              args: {
                value: {
                  value: { component: 'removedSource', method: 'value' },
                  order: 0,
                },
              },
            },
          ],
          condition: {
            type: 'equals',
            value: [
              {
                type: 'component',
                value: { component: 'removedSensor', method: 'value' },
              },
              { type: 'value', value: 1 },
            ],
          },
        },
      ],
    };
    stateMachine.transitions.transition = {
      sourceId: 'state',
      targetId: 'state',
      label: {
        position: { x: 0, y: 0 },
        do: [{ component: 'removedActor', method: 'run' }],
      },
    };

    expect(getMissingComponentReferences(stateMachine, platform)).toEqual([
      'removedActor',
      'removedSensor',
      'removedSource',
    ]);
  });

  it('accepts declared components, System and platform components on static platforms', () => {
    const stateMachine = machine();
    stateMachine.states.state = {
      name: 'State',
      position: { x: 0, y: 0 },
      dimensions: { width: 100, height: 100 },
      events: [
        {
          trigger: { component: 'System', method: 'onEnter' },
          do: [{ component: 'device', method: 'run' }],
        },
      ],
    };

    expect(getMissingComponentReferences(stateMachine, platform)).toEqual([]);

    const staticMachine = machine();
    staticMachine.components = {};
    staticMachine.states.state = {
      ...stateMachine.states.state,
      events: [
        {
          trigger: { component: 'System', method: 'onEnter' },
          do: [{ component: 'Device', method: 'run' }],
        },
      ],
    };
    expect(
      getMissingComponentReferences(staticMachine, { ...platform, staticComponents: true })
    ).toEqual([]);
  });
});
