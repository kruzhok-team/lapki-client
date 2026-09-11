import type { EventSelection } from '@renderer/lib/drawable';
import type { Action, EventData } from '@renderer/types/diagram';

export type EventDeletionTarget =
  | { type: 'event'; value: EventData }
  | { type: 'action'; value: Action };

export const getEventDeletionTarget = (
  events: EventData[],
  selection: EventSelection
): EventDeletionTarget | null => {
  const event = events[selection.eventIdx];
  if (!event) return null;

  if (selection.actionIdx === null) return { type: 'event', value: event };

  const actions = event.do;
  if (!Array.isArray(actions)) return null;

  const action = actions[selection.actionIdx];
  return action ? { type: 'action', value: action } : null;
};
