import { describe, expect, test } from 'vitest';

import { EditorManager } from './EditorManager';

import { emptyElements } from '../../types/diagram';

const em = new EditorManager();
em.init('basename', 'name', { ...emptyElements(), transitions: [] });

describe('states', () => {
  test('create', () => {
    em.createState({ name: 'state', position: { x: 50, y: 75 }, id: '0' });

    const state = em.data.elements.states['0'];

    expect(state).not.toBeUndefined();
  });

  test('positioning', () => {
    em.createState({ name: 'state', position: { x: 0, y: 0 }, id: '1' });
    em.createState({ name: 'state', position: { x: 0, y: 0 }, placeInCenter: true, id: '2' });

    const state1 = em.data.elements.states['1'];
    const state2 = em.data.elements.states['2'];

    expect(state1.bounds, 'Без центрирования позиция должна совпадать').toEqual({
      x: 0,
      y: 0,
      width: 450,
      height: 100,
    });
    expect(
      state2.bounds,
      'С центрированием позция должна сдвигаться в половину ширины и высоты'
    ).toEqual({
      x: -225,
      y: -50,
      width: 450,
      height: 100,
    });
  });
});
