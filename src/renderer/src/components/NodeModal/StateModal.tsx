import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useModal } from '@renderer/hooks/useModal';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { EventSelection, State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, EventData } from '@renderer/types/diagram';

import type { ActionsHandle } from './components/Actions';
import { EventsHierarchy } from './components/EventsHierarchy';
import { EditEventModal } from './EditEventModal';
import { useEditEvent } from './hooks';

import { MovingModal } from '../UI/Modal/MovingModal';

interface StateModalProps {
  smId: string;
  controller: CanvasController;
}

interface ChangeEventPayload {
  state: State;
  eventSelection: EventSelection;
}

/**
 * Модальное окно редактирования состояния
 */
export const StateModal: React.FC<StateModalProps> = ({ smId, controller }) => {
  const modelController = useModelContext();
  const components = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  modelController.model.useData(smId, 'elements.states');
  const platforms = controller.useData('platform') as { [id: string]: PlatformManager };
  const platform = platforms[smId];

  const [isOpen, open, close] = useModal(false);
  const [state, setState] = useState<State | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState<number | undefined>();
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [color, setColor] = useState<string | undefined>();

  // Индекс выбранного действия в иерархии (только для подсветки, не влияет на экран)
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [expandedActionRequest, setExpandedActionRequest] = useState<{
    index: number;
    requestId: number;
  } | null>(null);
  const actionRequestId = useRef(0);
  const actionsRef = useRef<ActionsHandle>(null);

  const editEventProps = useEditEvent(smId, controller, state, currentEvent, currentEventIndex);
  const { handleSubmit: handleEditEventSubmit } = editEventProps;

  const stateName = state?.data.name ?? '';

  useEffect(() => {
    const handler = (s: State) => {
      setState(s);
      setColor(s.data.color);
      // Сразу выбираем первое событие если оно есть
      if (s.data.events.length > 0) {
        setCurrentEventIndex(0);
        setCurrentEvent(s.data.events[0]);
      } else {
        setCurrentEventIndex(undefined);
        setCurrentEvent(null);
      }
      setSelectedActionIndex(null);
      setExpandedActionRequest(null);
      open();
    };

    // Open modal when a full state is requested
    controller.states.on('changeState', handler);

    // Also open modal when an event/action is requested (from canvas double-click)
    const changeEventHandler = (data: ChangeEventPayload) => {
      try {
        const s: State = data.state;
        const eventSelection = data.eventSelection;
        setState(s);
        setColor(s.data.color);

        if (typeof eventSelection?.eventIdx === 'number') {
          const idx = eventSelection.eventIdx;
          setCurrentEventIndex(idx);
          setCurrentEvent(s.data.events[idx]);
        } else {
          setCurrentEventIndex(undefined);
          setCurrentEvent(null);
        }

        if (typeof eventSelection?.actionIdx === 'number') {
          const aIdx = eventSelection.actionIdx;
          setSelectedActionIndex(aIdx);
          setExpandedActionRequest({ index: aIdx, requestId: actionRequestId.current++ });
        } else {
          setSelectedActionIndex(null);
          setExpandedActionRequest(null);
        }

        open();
      } catch {
        // ignore malformed payloads
      }
    };

    controller.states.on('changeEvent', changeEventHandler);

    return () => {
      controller.states.off('changeState', handler);
      controller.states.off('changeEvent', changeEventHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAfterClose = () => {
    if (state && state.data.color !== color) {
      modelController.changeState({ ...state.data, color, smId, id: state.id });
    }
    setColor(undefined);
    setState(null);
    setCurrentEvent(null);
    setCurrentEventIndex(undefined);
    setSelectedActionIndex(null);
    setExpandedActionRequest(null);
    close();
  };

  const addEvent = () => {
    if (!state) return;
    const newIndex = state.data.events.length;
    const hasSystemOnEnter = state.data.events.some(
      (event) =>
        typeof event.trigger !== 'string' &&
        event.trigger.component === 'System' &&
        event.trigger.method === 'onEnter'
    );
    setCurrentEventIndex(newIndex);
    setCurrentEvent({
      trigger: hasSystemOnEnter
        ? { component: '', method: '' }
        : { component: 'System', method: 'onEnter' },
      do: [],
    });
    setSelectedActionIndex(null);
    setExpandedActionRequest(null);
  };

  const nextEvent = useCallback(
    (
      currentEventIndex: number | undefined,
      events: EventData[]
    ): [number, EventData] | [undefined, null] => {
      if (currentEventIndex === undefined) return [undefined, null];

      if (events.length === 1) return [undefined, null];
      if (currentEventIndex < events.length - 1) {
        return [currentEventIndex, events[currentEventIndex + 1]];
      }

      return [currentEventIndex - 1, events[currentEventIndex - 1]];
    },
    []
  );

  const removeSelected = () => {
    if (!state || currentEventIndex === undefined) return;

    if (selectedActionIndex !== null) {
      const isDeleted = modelController.deleteEvent({
        smId,
        stateId: state.id,
        event: { eventIdx: currentEventIndex, actionIdx: selectedActionIndex },
      });
      if (!isDeleted) return;

      setCurrentEvent(state.data.events[currentEventIndex]);
      setSelectedActionIndex(null);
      setExpandedActionRequest(null);
      return;
    }

    const [newIndex, newEvent] = nextEvent(currentEventIndex, state.data.events);
    const isDeleted = modelController.deleteEvent({
      smId,
      stateId: state.id,
      event: { eventIdx: currentEventIndex, actionIdx: null },
    });
    if (!isDeleted) return;

    // Выбираем соседнее событие после удаления
    setCurrentEvent(newEvent);
    setCurrentEventIndex(newIndex);
    setSelectedActionIndex(null);

    setExpandedActionRequest(null);
  };

  // Клик по событию в иерархии
  const handleSelectEvent = (eventIndex: number) => {
    if (!state) return;
    setCurrentEventIndex(eventIndex);
    setCurrentEvent(state.data.events[eventIndex]);
    setSelectedActionIndex(null);
    setExpandedActionRequest(null);
  };

  // Клик по действию в иерархии
  const handleSelectAction = (eventIndex: number, actionIndex: number) => {
    if (!state) return;
    setCurrentEventIndex(eventIndex);
    setCurrentEvent(state.data.events[eventIndex]);
    setSelectedActionIndex(actionIndex);

    setExpandedActionRequest({ index: actionIndex, requestId: actionRequestId.current++ });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editEventProps.actions.tabValue === 1) {
      if (handleEditEventSubmit()) actionsRef.current?.collapseAll();
      return;
    }
    const validatedActions = actionsRef.current?.validate();
    if (!validatedActions) return;
    if (handleEditEventSubmit(validatedActions)) actionsRef.current?.collapseAll();
  };

  return (
    <MovingModal
      id="shit"
      title={`Редактор состояния: ${stateName}`}
      isOpen={isOpen}
      onRequestClose={close}
      onAfterClose={handleAfterClose}
      onSubmit={currentEventIndex !== undefined ? handleModalSubmit : undefined}
      submitLabel="Сохранить"
      cancelLabel="Отмена"
      hideCancelButton
      className="min-h-[440px] w-[830px]"
    >
      <div className="flex h-full gap-4">
        {/* Левая панель: иерархия событий */}
        <div className="w-[284px] flex-shrink-0">
          <EventsHierarchy
            platform={platform}
            events={state?.data.events ?? []}
            components={components}
            selectedEventIndex={currentEventIndex}
            selectedActionIndex={selectedActionIndex}
            onSelectEvent={handleSelectEvent}
            onSelectAction={handleSelectAction}
            onAddEvent={addEvent}
            onRemoveSelected={removeSelected}
          />
        </div>

        {/* Правая панель: редактор */}
        <div className="min-h-[290px] min-w-0 flex-1">
          {currentEventIndex === undefined ? (
            <div className="flex h-full items-center justify-center text-text-inactive">
              Выберите событие или создайте новое
            </div>
          ) : (
            <div className="h-full">
              <EditEventModal
                actionsRef={actionsRef}
                expandedActionRequest={expandedActionRequest}
                {...editEventProps}
              />
            </div>
          )}
        </div>
      </div>
    </MovingModal>
  );
};
