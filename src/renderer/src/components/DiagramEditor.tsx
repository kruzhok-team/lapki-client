import { useEffect, useRef, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { State } from '@renderer/lib/drawable/State';

import { CreateModal, CreateModalResult } from './CreateModal';
import { CreateEventsModal, EventsModalResult } from './EventsModal';

import { EventSelection } from '@renderer/lib/drawable/Events';
import { Action } from '@renderer/types/diagram';
import { StateNameModal } from './StateNameModal';
import { Scale } from './Scale';
import { DiagramContextMenu } from './DiagramContextMenu';
import { useDiagramContextMenu } from '@renderer/hooks/useDiagramContextMenu';
import { useDiagramStateName } from '@renderer/hooks/useDiagramStateName';
import { Transition } from '@renderer/lib/drawable/Transition';

// цвет связи по-умолчанию
export const defaultTransColor: string = '#0000FF';

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

  const contextMenu = useDiagramContextMenu(editor, manager);
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
    editor.container.onStateDrop((position) => {
      editor?.container.machine.createState('Состояние', position);
    });

    //Здесь мы открываем модальное окно редактирования ноды
    editor.container.states.onStateCreate((state) => {
      ClearUseState();
      setState({ state });
      openModal();
      // manager.triggerDataUpdate();
    });

    editor.container.states.onStateEventCreate((state, event, click) => {
      ClearUseState();
      setIdEvents({ state, event, click });
      openEventsModal();
    });

    //Здесь мы открываем модальное окно редактирования созданной связи
    editor.container.transitions.onTransitionEdit((target) => {
      ClearUseState();
      setEvents(target.data.do ?? []);
      setTransition(target);
      openModal();
      // manager.triggerDataUpdate();
    });

    //Здесь мы открываем модальное окно редактирования новой связи
    editor.container.transitions.onNewTransitionCreate((source, target) => {
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
    if (!isModalOpen) {
      editor?.container.machine.changeEvent(data.id, data.trigger);
    }
    closeEventsModal();
  };

  const handleCreateModal = (data: CreateModalResult) => {
    if (data.key === 2) {
      editor?.container.machine.newPictoState(
        data.id,
        events,
        data.trigger.component,
        data.trigger.method
      );
    } else if (transition && data.key === 3) {
      editor?.container.machine.changeTransition(
        transition.id,
        data.color ?? defaultTransColor,
        data.trigger.component,
        data.trigger.method,
        events,
        data.condition
      );
    } else if (newTransition) {
      editor?.container.machine.createTransition(
        newTransition.source,
        newTransition?.target,
        defaultTransColor,
        data.trigger.component,
        data.trigger.method,
        events,
        data.condition
      );
    }
    closeModal();
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>

      <DiagramContextMenu {...contextMenu} />
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
          isTransition={transition ? { target: transition.condition } : undefined}
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
