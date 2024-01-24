import { memo, useEffect, useRef, useState } from 'react';

import { useDiagramContextMenu } from '@renderer/hooks/useDiagramContextMenu';
import { useDiagramStateName } from '@renderer/hooks/useDiagramStateName';
import { useModal } from '@renderer/hooks/useModal';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { EventSelection } from '@renderer/lib/drawable/Events';
import { State } from '@renderer/lib/drawable/State';
import { Transition } from '@renderer/lib/drawable/Transition';
import { Action, Event } from '@renderer/types/diagram';
import { defaultTransColor } from '@renderer/utils';

import { CreateModal, CreateModalResult } from './CreateModal/CreateModal';
import { DiagramContextMenu } from './DiagramContextMenu';
import { EventsModalData, EventsModal } from './EventsModal';
import { StateNameModal } from './StateNameModal';

export interface DiagramEditorProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = memo(
  ({ manager, editor, setEditor }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<{ state: State }>();
    const [events, setEvents] = useState<Action[]>([]);
    const [transition, setTransition] = useState<Transition | null>(null);
    const [newTransition, setNewTransition] = useState<{ source: State; target: State }>();

    const [isCreateModalOpen, openCreateModal, closeCreateModal] = useModal(false);

    const [isEventsModalOpen, openEventsModal, closeEventsModal] = useModal(false);
    const [eventsModalData, setEventsModalData] = useState<EventsModalData>();
    // Дополнительные данные о родителе события
    const [eventsModalParentData, setEventsModalParentData] = useState<{
      state: State;
      eventSelection: EventSelection;
    }>();

    const contextMenu = useDiagramContextMenu(editor, manager);
    const stateName = useDiagramStateName(editor);

    useEffect(() => {
      if (!containerRef.current) return;

      console.log('init editor');

      const editor = new CanvasEditor(containerRef.current, manager);

      //Функция очистки всех данных
      const ClearUseState = () => {
        setState(undefined);
        setEvents([]);
        setTransition(null);
        setNewTransition(undefined);
      };

      editor.container.on('dblclick', (position) => {
        editor?.container.machineController.createState({
          name: 'Состояние',
          position,
          placeInCenter: true,
        });
      });

      //Здесь мы открываем модальное окно редактирования ноды
      editor.container.statesController.on('changeState', (state) => {
        ClearUseState();
        setState({ state });
        openCreateModal();
      });

      editor.container.statesController.on('changeEvent', (data) => {
        const { state, eventSelection, event, isEditingEvent } = data;

        ClearUseState();
        setEventsModalParentData({ state, eventSelection });
        setEventsModalData({ event, isEditingEvent });
        openEventsModal();
      });

      //Здесь мы открываем модальное окно редактирования созданной связи
      editor.container.transitionsController.on('changeTransition', (target) => {
        ClearUseState();
        setEvents(target.data.do ?? []);
        setTransition(target);
        openCreateModal();
      });

      //Здесь мы открываем модальное окно редактирования новой связи
      editor.container.transitionsController.on('createTransition', ({ source, target }) => {
        ClearUseState();
        setNewTransition({ source, target });
        openCreateModal();
      });

      // слежка за редактором назначится по этой же строчке
      setEditor(editor);

      return () => {
        // снятие слежки произойдёт по смене редактора новым
        // manager.unwatchEditor();
        editor?.cleanUp();
      };
      // FIXME: containerRef не влияет на перезапуск эффекта.
      // Скорее всего, контейнер меняться уже не будет, поэтому
      // реф закомментирован, но если что, https://stackoverflow.com/a/60476525.
      // }, [ containerRef.current ]);
    }, [manager, setEditor]);

    const handleEventsModalSubmit = (data: Event) => {
      // Если есть какие-то данные то мы редактируем событие а не добавляем
      if (eventsModalData) {
        setEvents((p) => {
          const { component, method } = eventsModalData.event;
          const prevEventIndex = p.findIndex(
            (v) => v.component === component && v.method === method
          );

          if (prevEventIndex === -1) return p;

          const newEvents = [...p];

          newEvents[prevEventIndex] = data;

          return newEvents;
        });
      } else {
        setEvents((p) => [...p, data]);
      }

      if (!isCreateModalOpen && eventsModalParentData) {
        editor?.container.machineController.changeEvent(
          eventsModalParentData.state.id,
          eventsModalParentData.eventSelection,
          data
        );
      }
      closeEventsModal();
    };

    const handleCreateModalSubmit = (data: CreateModalResult) => {
      if (data.key === 2) {
        editor?.container.machineController.changeStateEvents({
          id: data.id,
          triggerComponent: data.trigger.component,
          triggerMethod: data.trigger.method,
          actions: events,
        });
      } else if (transition && data.key === 3) {
        editor?.container.machineController.changeTransition({
          id: transition.id,
          source: transition.source.id,
          target: transition.target.id,
          color: data.color ?? defaultTransColor,
          component: data.trigger.component,
          method: data.trigger.method,
          doAction: events,
          condition: data.condition,
        });
      } else if (newTransition) {
        editor?.container.machineController.createTransition({
          source: newTransition.source.id,
          target: newTransition.target.id,
          color: data.color ?? defaultTransColor,
          component: data.trigger.component,
          method: data.trigger.method,
          doAction: events,
          condition: data.condition,
        });
      }
      closeCreateModal();
    };

    const handleOpenEventsModal = (event?: Event) => {
      setEventsModalData(event && { event, isEditingEvent: false });
      setEventsModalParentData(undefined);

      openEventsModal();
    };

    return (
      <>
        <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef} />

        <DiagramContextMenu {...contextMenu} />
        <StateNameModal {...stateName} />

        {editor && (
          <EventsModal
            editor={editor}
            manager={manager}
            initialData={eventsModalData}
            onSubmit={handleEventsModalSubmit}
            isOpen={isEventsModalOpen}
            onClose={closeEventsModal}
          />
        )}

        {editor && (
          <CreateModal
            editor={editor}
            manager={manager}
            isState={state}
            isTransition={transition ? { transition: transition } : undefined}
            isEvents={events}
            setIsEvents={setEvents}
            onOpenEventsModal={handleOpenEventsModal}
            onSubmit={handleCreateModalSubmit}
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
          />
        )}
      </>
    );
  }
);
