import { beforeEach, describe, expect, test } from 'vitest';

import { EditorModel } from './EditorModel';

import { NormalState, emptyElements } from '../../../types/diagram';

const em = new EditorModel();
em.init('basename', 'name', emptyElements());

describe('states', () => {
  describe('create', () => {
    beforeEach(() => {
      em.data.elements.states = {};
    });

    test('basic', () => {
      em.createState({ name: 'state', position: { x: 100, y: 150 }, id: '0' });

      expect(em.data.elements.states).toHaveProperty('0', {
        name: 'state',
        bounds: { x: 100, y: 150, width: 450, height: 100 },
        events: [],
        parent: undefined,
      });
    });

    test('in center', () => {
      em.createState({ name: 'state', position: { x: 100, y: 150 }, placeInCenter: true, id: '0' });

      expect(em.data.elements.states).toHaveProperty('0', {
        name: 'state',
        bounds: { x: -125, y: 100, width: 450, height: 100 },
        events: [],
        parent: undefined,
      });
    });

    test('without id', () => {
      const count = 10;

      for (let i = 0; i < count; i++) {
        em.createState({ name: 'state', position: { x: 0, y: 0 } });
      }

      const ids = Object.keys(em.data.elements.states);

      expect(ids, 'Все айди должны быть уникальными').toHaveLength(count);
    });

    test('with parentId', () => {
      em.createState({ name: 'state', position: { x: 0, y: 0 }, id: '0', parentId: '1' });

      expect(em.data.elements.states).toHaveProperty('0', expect.objectContaining({ parent: '1' }));
    });

    test('with events', () => {
      em.createState({
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
      });

      const state = em.data.elements.states['0'] as NormalState;

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
      em.data.elements.states = {};
    });

    test('no state found', () => {
      const res = em.changeStateEvents({
        id: '0',
        actions: [],
        triggerComponent: '',
        triggerMethod: '',
      });

      expect(res, 'Должно вернуться false если состояния не существует').toBe(false);
    });
  });
});
