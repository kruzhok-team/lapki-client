import { describe, expect, it } from 'vitest';

import {
  countUnicodeCharacters,
  getReaderImpulseLabel,
  limitUnicodeCharacters,
} from './readerModel';

describe('Reader input model', () => {
  it('counts Unicode code points instead of UTF-16 code units', () => {
    expect(countUnicodeCharacters('Я🙂')).toBe(2);
  });

  it('limits input without splitting a surrogate pair', () => {
    expect(limitUnicodeCharacters('a🙂b', 2)).toBe('a🙂');
  });

  it.each([
    ['impulseA', 'Импульс А'],
    ['impulseB', 'Импульс Б'],
    ['impulseC', 'Импульс В'],
  ])('formats the reader impulse %s as %s', (impulse, label) => {
    expect(getReaderImpulseLabel(impulse)).toBe(label);
  });

  it('preserves an unknown impulse name', () => {
    expect(getReaderImpulseLabel('customImpulse')).toBe('customImpulse');
  });
});
