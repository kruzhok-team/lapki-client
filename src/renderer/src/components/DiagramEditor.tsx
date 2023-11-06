import { useEffect, useRef, useState } from 'react';

import { useDiagramStateName } from '@renderer/hooks/useDiagramStateName';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { EventSelection } from '@renderer/lib/drawable/Events';
import { State } from '@renderer/lib/drawable/State';
import { Transition } from '@renderer/lib/drawable/Transition';
import { Action } from '@renderer/types/diagram';

import { CreateModal, CreateModalResult } from './CreateModal';
import { CreateEventsModal, EventsModalResult } from './EventsModal';
import { Scale } from './Scale';
import { StateNameModal } from './StateNameModal';

// цвет связи по-умолчанию
export const defaultTransColor = '#0000FF';

export interface DiagramEditorProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ manager, editor, setEditor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ state: State }>();
  const [events, setEvents] = useState<Action[]>([]);
  const [idEvents, setIdEvents] = useState<{
    state: State;
    event: EventSelection;
    click: boolean;
  }>();
  const [transition, setTransition] = useState<Transition | null>(null);
  const [newTransition, setNewTransition] = useState<{ source: State; target: State }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const openEventsModal = () => setIsEventsModalOpen(true);
  const closeEventsModal = () => setIsEventsModalOpen(false);

  const stateName = useDiagramStateName(editor);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = new CanvasEditor(containerRef.current, manager);

    //Функция очистки всех данных
    const ClearUseState = () => {
      setState(undefined);
      setEvents([]);
      setIdEvents(undefined);
      setTransition(null);
      setNewTransition(undefined);
    };

    //Перетаскиваем компонент в редактор
    editor.container.on('stateDrop', (position) => {
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
      openModal();
      // manager.triggerDataUpdate();
    });

    editor.container.statesController.on('changeEvent', ({ state, event, click }) => {
      ClearUseState();
      setIdEvents({ state, event, click });
      openEventsModal();
    });

    //Здесь мы открываем модальное окно редактирования созданной связи
    editor.container.transitionsController.on('changeTransition', (target) => {
      ClearUseState();
      setEvents(target.data.do ?? []);
      setTransition(target);
      openModal();
      // manager.triggerDataUpdate();
    });

    //Здесь мы открываем модальное окно редактирования новой связи
    editor.container.transitionsController.on('createTransition', ({ source, target }) => {
      ClearUseState();
      setNewTransition({ source, target });
      openModal();
      // manager.triggerDataUpdate();
    });

    setEditor(editor);
    // слежка за редактором назначится по этой же строчке

    return () => {
      // снятие слежки произойдёт по смене редактора новым
      // manager.unwatchEditor();
      editor?.cleanUp();
    };
    // FIXME: containerRef не влияет на перезапуск эффекта.
    // Скорее всего, контейнер меняться уже не будет, поэтому
    // реф закомментирован, но если что, https://stackoverflow.com/a/60476525.
    // }, [ containerRef.current ]);
  }, [manager]);

  const handleCreateEventsModal = (data: EventsModalResult) => {
    setEvents([...events, data.action]);
    if (!isModalOpen && data.id?.event) {
      editor?.container.machineController.changeEvent(
        data.id?.state.id,
        data.id.event,
        data.trigger
      );
    }
    closeEventsModal();
  };

  const handleCreateModal = (data: CreateModalResult) => {
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
    closeModal();
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>

      <StateNameModal {...stateName} />

      {editor !== null ? (
        <CreateEventsModal
          editor={editor}
          manager={manager}
          isOpen={isEventsModalOpen}
          isData={idEvents}
          onClose={closeEventsModal}
          onSubmit={handleCreateEventsModal}
        />
      ) : (
        ''
      )}

      {isModalOpen ? (
        <CreateModal
          editor={editor}
          manager={manager}
          isCondition={events}
          setIsCondition={setEvents}
          isOpen={isModalOpen}
          onOpenEventsModal={openEventsModal}
          isData={state}
          isTransition={transition ? { target: transition } : undefined}
          onClose={closeModal}
          onSubmit={handleCreateModal}
        />
      ) : (
        ''
      )}

      {editor && <Scale editor={editor} manager={manager} />}
    </>
  );
};
