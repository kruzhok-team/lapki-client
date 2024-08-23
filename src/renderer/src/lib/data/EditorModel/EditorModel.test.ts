import { beforeEach, describe, expect, test } from 'vitest';

import { EditorModel } from './EditorModel';

import { emptyElements } from '../../../types/diagram';

const em = new EditorModel(
  () => 42,
  () => 42
);
em.init('basename', 'name', emptyElements());

describe('states', () => {
  describe('create', () => {
    beforeEach(() => {
      em.data.elements.stateMachines['G'].states = {};
    });

    test('basic', () => {
      em.createState({
        smId: 'G',
        name: 'state',
        position: { x: 100, y: 150 },
        id: '0',
        color: '#FFFFFF',
      });

      expect(em.data.elements.stateMachines['G'].states).toHaveProperty('0', {
        name: 'state',
        bounds: { x: 100, y: 150, width: 450, height: 100 },
        events: [],
        parent: undefined,
        color: '#FFFFFF',
      });
    });

    test('in center', () => {
      em.createState({
        smId: 'G',
        name: 'state',
        position: { x: 100, y: 150 },
        placeInCenter: true,
        id: '0',
        color: '#FFFFFF',
      });

      expect(em.data.elements.stateMachines['G'].states).toHaveProperty('0', {
        name: 'state',
        bounds: { x: -125, y: 100, width: 450, height: 100 },
        events: [],
        parent: undefined,
        color: '#FFFFFF',
      });
    });

    test('without id', () => {
      const count = 10;

      for (let i = 0; i < count; i++) {
        em.createState({ smId: 'G', name: 'state', position: { x: 0, y: 0 }, color: '#FFFFFF' });
      }

      const ids = Object.keys(em.data.elements.stateMachines['G'].states);

      expect(ids, 'Все айди должны быть уникальными').toHaveLength(count);
    });

    test('with parentId', () => {
      em.createState({
        smId: 'G',
        name: 'state',
        position: { x: 0, y: 0 },
        id: '0',
        parentId: '1',
        color: '#FFFFFF',
      });

      expect(em.data.elements.stateMachines['G'].states).toHaveProperty(
        '0',
        expect.objectContaining({ parent: '1' })
      );
    });

    test('with events', () => {
      em.createState({
        smId: 'G',
        name: 'state',
        position: { x: 0, y: 0 },
        id: '0',
        events: [
          {
            trigger: { component: 'a', method: 'b', args: {} },
            do: [
              {
                component: 'c',
                method: 'd',
                args: {},
              },
            ],
          },
        ],
        color: '#FFFFFF',
      });

      const state = em.data.elements.stateMachines['G'].states['0'];

      expect(state.events).toEqual([
        {
          trigger: { component: 'a', method: 'b', args: {} },
          do: [
            {
              component: 'c',
              method: 'd',
              args: {},
            },
          ],
        },
      ]);
    });
  });

  describe('change events', () => {
    beforeEach(() => {
      em.data.elements.stateMachines['G'].states = {};
    });

    test('no state found', () => {
      const res = em.changeStateEvents({
        smId: 'G',
        id: '0',
        eventData: {
          trigger: {
            component: '',
            method: '',
          },
          do: [],
        },
        color: '#FFFFFF',
      });

      expect(res, 'Должно вернуться false если состояния не существует').toBe(false);
    });
  });
});
