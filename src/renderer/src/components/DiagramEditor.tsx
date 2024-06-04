import { useEffect, useMemo, useRef, useState } from 'react';

import { Scale } from '@renderer/components';
import { useSettings, useModal } from '@renderer/hooks';
import { DEFAULT_STATE_COLOR, DEFAULT_TRANSITION_COLOR } from '@renderer/lib/constants';
import {
  EventSelection,
  Note,
  State,
  Transition,
  ChoiceState,
  FinalState,
} from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Action, Event } from '@renderer/types/diagram';

import { CreateModal, CreateModalResult } from './CreateModal/CreateModal';
import { EventsModal, EventsModalData } from './EventsModal/EventsModal';
import { NoteEdit } from './NoteEdit';
import { StateNameModal } from './StateNameModal';

export const DiagramEditor: React.FC = () => {
  const editor = useEditorContext();

  const isMounted = editor.model.useData('isMounted');

  const [canvasSettings] = useSettings('canvas');

  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State | null>(null);
  const [events, setEvents] = useState<Action[]>([]);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [newTransitionData, setNewTransitionData] = useState<{
    source: State | ChoiceState;
    target: State | ChoiceState | FinalState;
  }>();

  const [isCreateModalOpen, openCreateModal, closeCreateModal] = useModal(false);

  const [isEventsModalOpen, openEventsModal, closeEventsModal] = useModal(false);
  const [eventsModalData, setEventsModalData] = useState<EventsModalData>();
  // Дополнительные данные о родителе события
  const [eventsModalParentData, setEventsModalParentData] = useState<{
    state: State;
    eventSelection: EventSelection;
  }>();

  useEffect(() => {
    if (!containerRef.current) return;

    editor.mount(containerRef.current);

    //Функция очистки всех данных
    const ClearUseState = () => {
      setState(null);
      setEvents([]);
      setTransition(null);
      setNewTransitionData(undefined);
    };

    const handleDblclick = (position: Point) => {
      editor.controller.states.createState({
        name: 'Состояние',
        position,
        placeInCenter: true,
        color: DEFAULT_STATE_COLOR,
      });
    };

    const handleChangeState = (state: State) => {
      ClearUseState();
      setState(state);
      openCreateModal();
    };

    const handleChangeEvent = (data: {
      state: State;
      eventSelection: EventSelection;
      event: Event;
      isEditingEvent: boolean;
    }) => {
      const { state, eventSelection, event, isEditingEvent } = data;

      ClearUseState();
      setEventsModalParentData({ state, eventSelection });
      setEventsModalData({ event, isEditingEvent });
      openEventsModal();
    };

    const handleChangeTransition = (transition: Transition) => {
      ClearUseState();
      setEvents(transition.data.label?.do ?? []);
      setTransition(transition);
      openCreateModal();
    };

    const handleCreateTransition = (data: {
      source: State | ChoiceState;
      target: State | ChoiceState | FinalState;
    }) => {
      ClearUseState();
      setNewTransitionData(data);
      openCreateModal();
    };

    editor.view.on('dblclick', handleDblclick);
    editor.controller.states.on('changeState', handleChangeState);
    editor.controller.states.on('changeEvent', handleChangeEvent);
    editor.controller.transitions.on('changeTransition', handleChangeTransition);
    editor.controller.transitions.on('createTransition', handleCreateTransition);

    //! Не забывать удалять слушатели
    return () => {
      editor.view.off('dblclick', handleDblclick);
      editor.controller.states.off('changeState', handleChangeState);
      editor.controller.states.off('changeEvent', handleChangeEvent);
      editor.controller.transitions.off('changeTransition', handleChangeTransition);
      editor.controller.transitions.off('createTransition', handleCreateTransition);

      editor.unmount();
    };
    // FIXME: containerRef не влияет на перезапуск эффекта.
    // Скорее всего, контейнер меняться уже не будет, поэтому
    // реф закомментирован, но если что, https://stackoverflow.com/a/60476525.
    // }, [ containerRef.current ]);
  }, [editor, openCreateModal, openEventsModal]);

  useEffect(() => {
    if (!canvasSettings) return;

    editor.setSettings(canvasSettings);
  }, [canvasSettings, editor]);

  const handleEventsModalSubmit = (data: Event) => {
    // Если есть какие-то данные то мы редактируем событие а не добавляем
    if (eventsModalData) {
      setEvents((p) => {
        const { component, method } = eventsModalData.event;
        const prevEventIndex = p.findIndex((v) => v.component === component && v.method === method);

        if (prevEventIndex === -1) return p;

        const newEvents = [...p];

        newEvents[prevEventIndex] = data;

        return newEvents;
      });
    } else {
      setEvents((p) => [...p, data]);
    }

    if (!isCreateModalOpen && eventsModalParentData) {
      editor?.controller.states.changeEvent(
        eventsModalParentData.state.id,
        eventsModalParentData.eventSelection,
        data
      );
    }
    closeEventsModal();
  };

  // TODO(bryzZz) Нужно делить на две модалки
  // Тут возникло много "as any"
  // это потому что для состояния и перехода типы разные, но модалка одна
  // и приходится приводить к какому-то общему типу
  const handleCreateModalSubmit = (data: CreateModalResult) => {
    if (data.key === 2) {
      editor.controller.states.changeStateEvents({
        id: data.id,
        triggerComponent: (data.trigger as any).component,
        triggerMethod: (data.trigger as any).method,
        actions: events,
        color: data.color ?? DEFAULT_STATE_COLOR,
      });
    } else if (transition && data.key === 3) {
      editor.controller.transitions.changeTransition({
        id: transition.id,
        source: transition.source.id,
        target: transition.target.id,
        color: data.color ?? DEFAULT_TRANSITION_COLOR,
        label: {
          trigger: data.trigger,
          do: events,
          condition: data.condition,
        } as any,
      });
    } else if (newTransitionData) {
      editor.controller.transitions.createTransition({
        source: newTransitionData.source.id,
        target: newTransitionData.target.id,
        color: data.color ?? DEFAULT_TRANSITION_COLOR,
        label: {
          trigger: data.trigger,
          condition: data.condition,
          do: events,
        } as any,
      });
    }
    closeCreateModal();
  };

  const handleOpenEventsModal = (event?: Event) => {
    setEventsModalData(event && { event, isEditingEvent: false });
    setEventsModalParentData(undefined);

    openEventsModal();
  };

  // Если создается новый переход и это переход из состояния выбора то показывать триггер не нужно
  const showTrigger = useMemo(() => {
    if (newTransitionData) {
      return !(newTransitionData.source instanceof ChoiceState);
    }

    if (transition) {
      return !(transition.source instanceof ChoiceState);
    }

    return true;
  }, [newTransitionData, transition]);

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}>
        {isMounted && <Scale />}
      </div>

      {isMounted && (
        <>
          <StateNameModal />
          <NoteEdit />

          <EventsModal
            initialData={eventsModalData}
            onSubmit={handleEventsModalSubmit}
            isOpen={isEventsModalOpen}
            onClose={closeEventsModal}
          />

          <CreateModal
            state={state ?? undefined}
            transition={transition ?? undefined}
            events={events}
            showTrigger={showTrigger}
            setEvents={setEvents}
            onOpenEventsModal={handleOpenEventsModal}
            onSubmit={handleCreateModalSubmit}
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
          />
        </>
      )}
    </>
  );
};
