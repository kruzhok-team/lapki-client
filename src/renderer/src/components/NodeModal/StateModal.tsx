import React, { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useModal } from '@renderer/hooks/useModal';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { State } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, EventData } from '@renderer/types/diagram';

import { ActionsModal } from './ActionsModal/ActionsModal';
import { EventsHierarchy } from './components/EventsHierarchy';
import { EditEventModal } from './EditEventModal';
import { useActionEditor, useEditEvent } from './hooks';
import { useViewStack } from './hooks/useViewStack';

import { MovingModal } from '../UI/Modal/MovingModal';

interface StateModalProps {
  smId: string;
  controller: CanvasController;
}

type StateView = 'editEvent' | 'actions';

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

  const viewStack = useViewStack<StateView>({ view: 'editEvent', title: 'Редактор события' });

  const editEventProps = useEditEvent(smId, controller, state, currentEvent, currentEventIndex);
  const { handleSubmit: handleEditEventSubmit, getActions, updateActions } = editEventProps;

  const actionEditor = useActionEditor(smId, controller, (data, idx, initialData) => {
    // If this action was opened from the hierarchy, persist directly to model
    if (
      initialData?.persistOnSave &&
      state &&
      currentEventIndex !== undefined &&
      idx !== null &&
      idx !== undefined
    ) {
      modelController.changeEvent({
        smId,
        stateId: state.id,
        event: { eventIdx: currentEventIndex, actionIdx: idx },
        newValue: data,
      });

      // Update currentEvent locally to reflect saved action and open event view
      const ev = state.data.events[currentEventIndex];
      const evActions = Array.isArray(ev.do) ? [...ev.do] : [];
      evActions[idx] = data;
      setCurrentEvent({ ...ev, do: evActions });
      setCurrentEventIndex(currentEventIndex);
      toast.success('Действие сохранено!');
      setSelectedActionIndex(null);
      viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
      return;
    }

    // Otherwise update the edit-event buffer
    updateActions(data, idx ?? 0);
    setSelectedActionIndex(null);
    viewStack.pop();
  });

  const stateName = state?.data.name ?? '';

  useEffect(() => {
    const handler = (s: State) => {
      console.log('CHANGE STATE EVENT');
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
      viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
      open();
    };

    // Open modal when a full state is requested
    controller.states.on('changeState', handler);

    // Also open modal when an event/action is requested (from canvas double-click)
    const changeEventHandler = (data: any) => {
      try {
        const s: State = data.state;
        const eventSelection = data.eventSelection;
        const ev = data.event;
        const isEditingEvent = data.isEditingEvent;

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
          actionEditor.open({
            index: aIdx,
            action: ev,
            isEditingEvent,
            persistOnSave: true,
          });
          viewStack.reset({ view: 'actions', title: 'Выберите действие' });
        } else {
          setSelectedActionIndex(null);
          viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
        }

        open();
      } catch (err) {
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
    actionEditor.reset();
    viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
    close();
  };

  const addEvent = () => {
    if (!state) return;
    const newIndex = state.data.events.length;
    setCurrentEventIndex(newIndex);
    setCurrentEvent({ trigger: { component: 'System', method: 'onEnter' }, do: [] });
    setSelectedActionIndex(null);
    viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
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
      actionEditor.reset();
      viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
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

    if (newIndex !== undefined) {
      viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
    } else {
      viewStack.reset();
    }
  };

  // Клик по событию в иерархии
  const handleSelectEvent = (eventIndex: number) => {
    console.log('HANDLE SELECT ACTION');
    if (!state) return;
    setCurrentEventIndex(eventIndex);
    setCurrentEvent(state.data.events[eventIndex]);
    setSelectedActionIndex(null);
    viewStack.reset({ view: 'editEvent', title: 'Редактор события' });
  };

  useEffect(() => {
    console.log('view changed', viewStack.currentView);
  }, [viewStack.currentView]);

  // Клик по действию в иерархии
  const handleSelectAction = (eventIndex: number, actionIndex: number) => {
    if (!state) return;
    setCurrentEventIndex(eventIndex);
    setCurrentEvent(state.data.events[eventIndex]);
    setSelectedActionIndex(actionIndex);

    const actions = state.data.events[eventIndex].do;
    const action = Array.isArray(actions) ? actions[actionIndex] : undefined;
    console.log(action);
    // Opened from hierarchy — persist on save
    actionEditor.open({ index: actionIndex, action, persistOnSave: true });
    viewStack.push({ view: 'actions', title: 'Выберите действие' });
  };

  // Переход на экран actions из EditEventContent
  const handleOpenActionsView = (actionIndex: number | null) => {
    const currentActions = getActions();
    const index = actionIndex ?? currentActions.length;
    setSelectedActionIndex(index);
    actionEditor.open({
      index,
      action: actionIndex === null ? undefined : currentActions[actionIndex],
    });
    viewStack.push({ view: 'actions', title: 'Выберите действие' });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewStack.currentView === 'editEvent') {
      handleEditEventSubmit();
    }
    if (viewStack.currentView === 'actions') actionEditor.handleSubmit();
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
      onCancel={
        viewStack.canGoBack
          ? () => {
              viewStack.pop();
            }
          : undefined
      }
      hideCancelButton={!viewStack.canGoBack}
      className="min-h-[440px] w-[830px]"
    >
      <div className="flex h-full gap-4">
        {/* Левая панель: иерархия событий */}
        <div className="w-[284px] flex-shrink-0">
          <EventsHierarchy
            smId={smId}
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
              <div className="h-full" hidden={viewStack.currentView !== 'editEvent'}>
                <EditEventModal onOpenActionsView={handleOpenActionsView} {...editEventProps} />
              </div>

              <div className="h-full min-h-0" hidden={viewStack.currentView !== 'actions'}>
                <ActionsModal {...actionEditor.modalProps} />
              </div>
            </div>
          )}
        </div>
      </div>
    </MovingModal>
  );
};
