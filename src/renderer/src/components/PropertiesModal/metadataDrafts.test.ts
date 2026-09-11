import { describe, expect, it } from 'vitest';

import { emptyStateMachine } from '@renderer/types/diagram';

import {
  areMetadataEqual,
  createMetadataDrafts,
  metadataDraftToMeta,
  validateMetadataDrafts,
} from './metadataDrafts';

describe('PropertiesModal metadata drafts', () => {
  it('creates an independent ordered draft for every state machine', () => {
    const first = emptyStateMachine();
    first.meta = { alpha: '1', beta: '2' };
    const second = emptyStateMachine();
    second.meta = { gamma: '3' };

    expect(createMetadataDrafts(['first', 'second'], { first, second })).toEqual({
      first: [
        { id: 'first:0', name: 'alpha', value: '1' },
        { id: 'first:1', name: 'beta', value: '2' },
      ],
      second: [{ id: 'second:0', name: 'gamma', value: '3' }],
    });
  });

  it('marks every duplicate and validates trimmed empty names and empty values', () => {
    const errors = validateMetadataDrafts({
      first: [
        { id: 'one', name: ' mode ', value: '1' },
        { id: 'two', name: 'mode', value: '2' },
        { id: 'three', name: '   ', value: '' },
        { id: 'four', name: 'Mode', value: 'keeps case significant' },
      ],
    });

    expect(errors).toEqual({
      first: {
        one: { name: 'Название уже используется' },
        two: { name: 'Название уже используется' },
        three: { name: 'Обязательное поле', value: 'Обязательное поле' },
      },
    });
  });

  it('trims names while preserving values and entry order', () => {
    expect(
      metadataDraftToMeta([
        { id: 'one', name: ' alpha ', value: ' value ' },
        { id: 'two', name: 'beta', value: '2' },
      ])
    ).toEqual({ alpha: ' value ', beta: '2' });
  });

  it('compares both metadata values and their current enumeration order', () => {
    expect(areMetadataEqual({ alpha: '1', beta: '2' }, { alpha: '1', beta: '2' })).toBe(true);
    expect(areMetadataEqual({ alpha: '1', beta: '2' }, { beta: '2', alpha: '1' })).toBe(false);
    expect(areMetadataEqual({ alpha: '1' }, { alpha: '2' })).toBe(false);
  });
});
