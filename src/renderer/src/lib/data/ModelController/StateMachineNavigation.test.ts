import { describe, expect, test } from 'vitest';

import { getStateMachineDeletionFallbackId } from './StateMachineNavigation';

describe('getStateMachineDeletionFallbackId', () => {
  test('selects the previous state machine when it exists', () => {
    expect(getStateMachineDeletionFallbackId(['first', 'middle', 'last'], 'middle')).toBe('first');
  });

  test('selects the next state machine when deleting the first one', () => {
    expect(getStateMachineDeletionFallbackId(['first', 'second'], 'first')).toBe('second');
  });

  test('returns undefined when deleting the only state machine', () => {
    expect(getStateMachineDeletionFallbackId(['only'], 'only')).toBeUndefined();
  });

  test('returns undefined for an unknown state machine', () => {
    expect(getStateMachineDeletionFallbackId(['first'], 'missing')).toBeUndefined();
  });
});
