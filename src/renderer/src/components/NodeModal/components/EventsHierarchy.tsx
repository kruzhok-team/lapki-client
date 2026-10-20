import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ActionIcon } from '@renderer/assets/icons/action.svg';
import { ReactComponent as CollapseIcon } from '@renderer/assets/icons/collapse.svg';
import { ReactComponent as EventIcon } from '@renderer/assets/icons/event.svg';
import { WithHint } from '@renderer/components/UI';
import { AddButton } from '@renderer/components/UI/AddButton';
import { DeleteButton } from '@renderer/components/UI/DeleteButton';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { Action, Component, EventData } from '@renderer/types/diagram';

import {
  getActionText,
  getConditionText,
  getTriggerText,
  groupEventsByTrigger,
} from './eventsHierarchyModel';

const SHOW_EVENT_ACTIONS = true;

interface EventsHierarchyProps {
  platform: PlatformManager;
  events: EventData[];
  components: { [id: string]: Component };
  selectedEventIndex: number | undefined;
  selectedActionIndex: number | null;
  onSelectEvent: (eventIndex: number) => void;
  onSelectAction: (eventIndex: number, actionIndex: number) => void;
  onAddEvent: () => void;
  onRemoveSelected: () => void;
}

const getEventActions = (event: EventData): Action[] =>
  event.do && typeof event.do !== 'string' ? event.do : [];

const Hint: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <WithHint hint={text}>{(hintProps) => <div {...hintProps}>{children}</div>}</WithHint>
);

// Левая панель трёхуровневой иерархии: триггер → условие → действие.
export const EventsHierarchy: React.FC<EventsHierarchyProps> = ({
  platform,
  events,
  components,
  selectedEventIndex,
  selectedActionIndex,
  onSelectEvent,
  onSelectAction,
  onAddEvent,
  onRemoveSelected,
}) => {
  const groups = groupEventsByTrigger(events);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<EventData['trigger']>>(new Set());
  const [collapsedConditions, setCollapsedConditions] = useState<Set<EventData>>(new Set());

  const toggleSetItem = <Item,>(
    setter: React.Dispatch<React.SetStateAction<Set<Item>>>,
    item: Item
  ) => {
    setter((previous) => {
      const next = new Set(previous);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const selectedEvent = selectedEventIndex === undefined ? undefined : events[selectedEventIndex];
  const selectedActions = selectedEvent ? getEventActions(selectedEvent) : [];
  const hasSelectedElement =
    selectedEvent !== undefined &&
    (selectedActionIndex === null || selectedActions[selectedActionIndex] !== undefined);

  return (
    <div className="flex h-full min-h-[290px] flex-col rounded-lg border border-border-primary p-3">
      <div className="flex flex-row justify-between pb-3">
        <span className="font-medium">{SHOW_EVENT_ACTIONS ? 'События и действия' : 'События'}</span>
        <div className="flex gap-3">
          <AddButton onClick={onAddEvent} />
          <DeleteButton disabled={!hasSelectedElement} onClick={onRemoveSelected} />
        </div>
      </div>

      <div className="flex-1 items-center overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {groups.length === 0 ? (
          <div className="flex h-full select-none items-center justify-center p-4 text-center text-text-inactive">
            Нет событий
          </div>
        ) : (
          groups.map((group) => {
            const groupId = group.events[0].eventIndex;
            const isGroupCollapsed = collapsedGroups.has(group.trigger);
            const triggerText = getTriggerText(group.trigger, platform, components);

            return (
              <div key={groupId}>
                <Hint text={triggerText}>
                  <div
                    className="mt-1.5 flex cursor-pointer select-none items-center gap-1 rounded-lg px-1 hover:bg-bg-hover"
                    onClick={() => toggleSetItem(setCollapsedGroups, group.trigger)}
                  >
                    <span
                      className={twMerge(
                        'block flex-shrink-0 rounded p-0.5 text-xs leading-none',
                        !isGroupCollapsed && '-rotate-90'
                      )}
                    >
                      <CollapseIcon />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
                      <EventIcon className="size-5 flex-shrink-0" />
                      <span className="min-w-0 truncate leading-5">{triggerText}</span>
                    </div>
                  </div>
                </Hint>

                {!isGroupCollapsed &&
                  group.events.map(({ event, eventIndex }) => {
                    const actions = getEventActions(event);
                    const conditionText = getConditionText(event.condition, platform, components);
                    const isConditionCollapsed = collapsedConditions.has(event);

                    return (
                      <div key={eventIndex}>
                        <Hint text={conditionText}>
                          <div
                            className={twMerge(
                              'mt-1.5 flex cursor-pointer select-none items-center gap-1 rounded-lg py-0.5 pl-7 pr-2 hover:bg-bg-hover',
                              selectedEventIndex === eventIndex &&
                                selectedActionIndex === null &&
                                'bg-bg-active hover:bg-bg-active'
                            )}
                            onClick={() => onSelectEvent(eventIndex)}
                          >
                            {SHOW_EVENT_ACTIONS && actions.length > 0 && (
                              <span
                                className={twMerge(
                                  'block flex-shrink-0 rounded p-0.5 text-xs leading-none',
                                  !isConditionCollapsed && '-rotate-90'
                                )}
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  toggleSetItem(setCollapsedConditions, event);
                                }}
                              >
                                <CollapseIcon />
                              </span>
                            )}
                            <span className="min-w-0 truncate leading-5">{conditionText}</span>
                          </div>
                        </Hint>

                        {SHOW_EVENT_ACTIONS &&
                          !isConditionCollapsed &&
                          actions.map((action, actionIndex) => {
                            const actionText = getActionText(action, platform, components);
                            return (
                              <Hint
                                key={actionIndex}
                                text={actionText}
                              >
                                <div
                                  className={twMerge(
                                    'mt-1.5 flex min-w-0 cursor-pointer select-none flex-row items-center gap-1 rounded-lg py-0.5 pl-12 pr-2 text-text-primary hover:bg-bg-hover',
                                    selectedEventIndex === eventIndex &&
                                      selectedActionIndex === actionIndex &&
                                      'bg-bg-active hover:bg-bg-active'
                                  )}
                                  onClick={() => onSelectAction(eventIndex, actionIndex)}
                                >
                                  <ActionIcon className="size-6 flex-shrink-0" />
                                  <span className="min-w-0 flex-1 truncate">{actionText}</span>
                                </div>
                              </Hint>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
