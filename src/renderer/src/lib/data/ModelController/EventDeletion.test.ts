import { describe, expect, test } from 'vitest';

import type { EventData } from '@renderer/types/diagram';

import { getEventDeletionTarget } from './EventDeletion';

const events: EventData[] = [
  {
    trigger: { component: 'System', method: 'onEnter' },
    do: [{ component: 'Component', method: 'run' }],
  },
];

describe('getEventDeletionTarget', () => {
  test('targets the last action without promoting the deletion to its event', () => {
    expect(getEventDeletionTarget(events, { eventIdx: 0, actionIdx: 0 })).toEqual({
      type: 'action',
      value: (events[0].do as Exclude<EventData['do'], string>)[0],
    });
  });

  test('targets the whole event when the event itself is selected', () => {
    expect(getEventDeletionTarget(events, { eventIdx: 0, actionIdx: null })).toEqual({
      type: 'event',
      value: events[0],
    });
  });

  test('rejects a selection that is not present in the hierarchy', () => {
    expect(getEventDeletionTarget(events, { eventIdx: 0, actionIdx: 1 })).toBeNull();
  });
});
