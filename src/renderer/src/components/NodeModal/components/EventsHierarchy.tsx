import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ActionIcon } from '@renderer/assets/icons/action.svg';
import { ReactComponent as CollapseIcon } from '@renderer/assets/icons/collapse.svg';
import { ReactComponent as EventIcon } from '@renderer/assets/icons/event.svg';
import { WithHint } from '@renderer/components/UI';
import { AddButton } from '@renderer/components/UI/AddButton';
import { DeleteButton } from '@renderer/components/UI/DeleteButton';
import { serializeCondition, serializeEvent } from '@renderer/lib/data/GraphmlBuilder';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action, Component, Condition, EventData } from '@renderer/types/diagram';

interface EventsHierarchyProps {
  smId: string;
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

// Левая панель иерархии событий и действий в StateModal.

export const EventsHierarchy: React.FC<EventsHierarchyProps> = ({
  smId,
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
  const modelController = useModelContext();
  const visualData = modelController.model.useData(smId, 'elements.visual');

  // Множество индексов свёрнутых событий
  const [collapsedEvents, setCollapsedEvents] = useState<Set<number>>(new Set());

  const toggleCollapsed = (eventIdx: number) => {
    setCollapsedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventIdx)) {
        next.delete(eventIdx);
      } else {
        next.add(eventIdx);
      }
      return next;
    });
  };

  const getConditionText = (condition: string | Condition | undefined) => {
    if (!condition) return '';
    if (typeof condition === 'string') return ` [${condition}]`;
    return ` [${serializeCondition(condition, platform.data, components, true)}]`;
  };

  const getTriggerText = (event: EventData) => {
    if (typeof event.trigger === 'string') return event.trigger;
    return serializeEvent(components, platform.data, event.trigger, visualData as boolean);
  };

  const getActionText = (action: Action) => `${action.component}.${action.method}`;

  const getEventActions = (event: EventData): Action[] => {
    if (!event.do || typeof event.do === 'string') return [];
    return event.do as Action[];
  };

  const selectedEvent = selectedEventIndex === undefined ? undefined : events[selectedEventIndex];
  const selectedActions = selectedEvent ? getEventActions(selectedEvent) : [];
  const hasSelectedElement =
    selectedEvent !== undefined &&
    (selectedActionIndex === null || selectedActions[selectedActionIndex] !== undefined);

  return (
    <div className="flex h-full min-h-[290px] flex-col rounded-lg border border-border-primary p-3">
      <div className="flex flex-row justify-between pb-3">
        <span className="font-medium">События и действия</span>
        <div className="flex gap-3">
          <AddButton onClick={onAddEvent} />
          <DeleteButton disabled={!hasSelectedElement} onClick={onRemoveSelected} />
        </div>
      </div>
      {/* Список событий с действиями */}
      <div className="flex-1 items-center overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {events.length === 0 ? (
          <div className="flex h-full select-none items-center justify-center p-4 text-center text-text-inactive">
            Нет событий
          </div>
        ) : (
          events.map((event, eventIdx) => {
            const isEventSelected = eventIdx === selectedEventIndex;
            const eventActions = getEventActions(event);
            const hasActions = eventActions.length > 0;
            const isCollapsed = collapsedEvents.has(eventIdx);

            return (
              <div key={eventIdx}>
                {/* Строка события */}
                <WithHint hint={getTriggerText(event) + getConditionText(event.condition)}>
                  {(hintProps) => (
                    <div
                      {...hintProps}
                      className={twMerge(
                        'mt-1.5 flex cursor-pointer select-none items-center gap-1 rounded-lg px-1 hover:bg-bg-hover',
                        isEventSelected && selectedActionIndex === null && 'bg-bg-active',
                        eventIdx === 0 && 'my-0'
                      )}
                      onClick={() => onSelectEvent(eventIdx)}
                    >
                      {/* Кнопка сворачивания — показывается только если есть действия */}
                      <div
                        className={twMerge(
                          'flex-shrink-0 rounded p-0.5',
                          !hasActions && 'invisible'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapsed(eventIdx);
                        }}
                      >
                        <span
                          className={twMerge(
                            'block text-xs leading-none',
                            !isCollapsed && '-rotate-90'
                          )}
                        >
                          <CollapseIcon />
                        </span>
                      </div>

                      {/* Текст события */}
                      <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
                        <EventIcon className="flex-shrink-0" />
                        <div className="min-w-0 truncate leading-5">
                          <span>{getTriggerText(event)}</span>
                          {event.condition && <span>{getConditionText(event.condition)}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </WithHint>

                {/* Действия события */}
                {!isCollapsed &&
                  eventActions.map((action, actionIdx) => (
                    <div
                      key={actionIdx}
                      className={twMerge(
                        'mt-1.5 flex cursor-pointer select-none flex-row items-center gap-1 truncate rounded-lg pl-7 pr-2 text-text-primary hover:bg-bg-hover',
                        selectedEventIndex === eventIdx &&
                          selectedActionIndex === actionIdx &&
                          'bg-bg-active'
                      )}
                      onClick={() => onSelectAction(eventIdx, actionIdx)}
                      title={getActionText(action)}
                    >
                      <ActionIcon />
                      {getActionText(action)}
                    </div>
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
