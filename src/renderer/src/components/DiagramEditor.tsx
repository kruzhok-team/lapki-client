import { useEffect, useRef, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { Point } from '@renderer/types/graphics';

import { CreateModal, CreateModalResult } from './CreateModal';
import { CreateEventsModal, EventsModalResult } from './EventsModal';

import { ContextMenuForm, StateContextMenu, StateContextMenuData } from './StateContextMenu';
import { EventSelection } from '@renderer/lib/drawable/Events';
import { Action } from '@renderer/types/diagram';
import { StateNameModal, StateNameModalFormValues } from './CreateNameModal';
import { ChangeNameState } from '@renderer/types/other';
import { useTabs } from '@renderer/store/useTabs';

export interface DiagramEditorProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ manager, editor, setEditor }) => {
  const openTab = useTabs((state) => state.openTab);

  const containerRef = useRef<HTMLDivElement>(null);
  const [changeNameState, setChangeNameState] = useState<ChangeNameState | undefined>();
  const [state, setState] = useState<{ state: State }>();
  const [events, setEvents] = useState<Action[]>([]);
  const [idEvents, setIdEvents] = useState<{
    state: State;
    event: EventSelection;
    click: boolean;
  }>();
  const [transition, setTransition] = useState<{ target: Condition }>();
  const [newTransition, setNewTransition] = useState<{ source: State; target: State }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [isCreateNameModalOpen, setIsCreateNameModalOpen] = useState(false);
  const openCreateNameModal = () => setIsCreateNameModalOpen(true);
  const closeCreateNameModal = () => setIsCreateNameModalOpen(false);

  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const openEventsModal = () => setIsEventsModalOpen(true);
  const closeEventsModal = () => setIsEventsModalOpen(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  const [contextMenuData, setContextMenuData] = useState<StateContextMenuData>();

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new CanvasEditor(containerRef.current, manager.state.data);
    const ClearUseState = () => {
      //Очищаем все старые данные
      setState(undefined);
      setEvents([]);
      setIdEvents(undefined);
      setChangeNameState(undefined);
      setTransition(undefined);
      setNewTransition(undefined);
    };

    //Обработка правой кнопки на пустом поле
    editor.container.onFieldContextMenu((pos) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      const canvasPos = editor.container.relativeMousePos(pos);

      setContextMenuData({ data: null, canvasPos, position, event: undefined });
      setIsContextMenuOpen(true);
    });

    //Перетаскиваем компонент в редактор
    editor.container.onStateDrop((position) => {
      editor?.container.machine.createNewState('Состояние', position);
    });

    //Здесь мы открываем модальное окно редактирования имени ноды
    editor.container.states.onStateNameCreate((state: State) => {
      const globalOffset = state.container.app.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
      };
      ClearUseState();
      setChangeNameState({
        state,
        position,
        sizes: state.computedTitleSizes,
      });
      openCreateNameModal();
    });

    //Здесь мы открываем модальное окно редактирования ноды
    editor.container.states.onStateCreate((state) => {
      ClearUseState();
      setState({ state });
      openModal();
      // manager.triggerDataUpdate();
    });

    //Здесь мы открываем контекстное меню для состояния
    editor.container.states.onStateContextMenu((state: State, pos) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      const canvasPos = editor.container.relativeMousePos(pos);
      setContextMenuData({ data: state, canvasPos, position, event: undefined });
      setIsContextMenuOpen(true);
      // manager.triggerDataUpdate();
    });

    editor.container.states.onStateEventCreate((state, event, click) => {
      ClearUseState();
      setIdEvents({ state, event, click });
      openEventsModal();
    });

    editor.container.states.onEventContextMenu((state, pos, event) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      const canvasPos = editor.container.relativeMousePos(pos);
      setContextMenuData({ data: state, canvasPos, position, event });
      setIsContextMenuOpen(true);
    });

    //Здесь мы открываем модальное окно редактирования созданной связи
    editor.container.transitions.onTransitionCreate((target) => {
      ClearUseState();
      setEvents(target.transition.data.do ?? []);
      setTransition({ target });
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

    //Здесь мы открываем контекстное меню для связи
    editor.container.transitions.onTransitionContextMenu((condition: Condition, pos: Point) => {
      console.log(['handleContextMenu', condition]);

      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      const canvasPos = editor.container.relativeMousePos(pos);
      setContextMenuData({ data: condition, canvasPos, position, event: undefined });
      setIsContextMenuOpen(true);
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
  }, []);

  const handleCreateEventsModal = (data: EventsModalResult) => {
    setEvents([...events, data.action]);
    if (!isModalOpen) {
      editor?.container.machine.createEvent(data.id, data.trigger);
    }
    closeEventsModal();
  };

  const handleRename = (data: StateNameModalFormValues) => {
    const stateId = changeNameState?.state.id;
    if (!stateId) return;

    editor?.container.machine.updateState(stateId, data.name);
    closeCreateNameModal();
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
      const { x, y } = transition?.target.bounds;
      editor?.container.machine.createNewTransition(
        transition?.target.id,
        transition?.target.transition.source,
        transition?.target.transition.target,
        data.color ?? '#FFFFFF',
        data.trigger.component,
        data.trigger.method,
        events,
        data.condition,
        { x, y }
      );
    } else if (newTransition) {
      const { x, y } = newTransition?.target.bounds;
      editor?.container.machine.createNewTransition(
        undefined,
        newTransition?.source,
        newTransition?.target,
        data.color ?? '#FFFFFF',
        data.trigger.component,
        data.trigger.method,
        events,
        data.condition,
        { x, y }
      );
    }
    closeModal();
  };

  const contextMenuCallbacks = {
    onClickNewState: (pos: Point) => {
      editor?.container.machine.createNewState('Состояние', pos);
    },
    onClickInitial: (data: ContextMenuForm) => {
      editor?.container.machine.changeInitialState(data.name);
    },
    onClickShowCode: (data: ContextMenuForm) => {
      if (data.name === 'FullCode') {
        data.name = manager.state.shownName ?? 'Безымянная';
        data.content = manager.state.content!;
      }

      openTab({ type: data.type, name: data.name, code: data.content, language: 'json' });
    },
    onClickDelState: (data: ContextMenuForm) => {
      editor?.container.machine.deleteState(data.name);
    },
    onClickDelTran: (data: ContextMenuForm) => {
      editor?.container.machine.deleteTransition(data.name);
    },
    onClickDelEvent: (data: ContextMenuForm) => {
      editor?.container.machine.deleteEvent(data.name, data.eventId);
    },
    onCloseMe: () => {
      setIsContextMenuOpen(false);
    },
    onViewCentering: () => {
      setIsContextMenuOpen(false);
      editor?.container.viewCentering();
    },
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>

      <StateContextMenu
        isOpen={isContextMenuOpen}
        isData={contextMenuData}
        callbacks={contextMenuCallbacks}
      />

      <StateNameModal
        isOpen={isCreateNameModalOpen}
        initial={changeNameState}
        onClose={closeCreateNameModal}
        onRename={handleRename}
      />

      {editor !== null ? (
        <CreateEventsModal
          editor={editor}
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
          isCondition={events}
          setIsCondition={setEvents}
          isOpen={isModalOpen}
          onOpenEventsModal={openEventsModal}
          isData={state}
          isTransition={transition}
          onClose={closeModal}
          onSubmit={handleCreateModal}
        />
      ) : (
        ''
      )}
    </>
  );
};
