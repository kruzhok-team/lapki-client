import { FC, useEffect, useRef, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { Point, Rectangle } from '@renderer/types/graphics';

import { CreateModal, CreateModalFormValues } from './CreateModal';
import { CreateEventsModal, CreateEventsModalFormValues } from './CreateEventsModal';
import { CreateMethodModal, CreateMethodModalFormValues } from './CreateMethodModal';

import { ContextMenuForm, StateContextMenu, StateContextMenuData } from './StateContextMenu';
import { EventSelection } from '@renderer/lib/drawable/Events';

interface DiagramEditorProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
  setIdTextCode: (id: string | null) => void;
  setElementCode: (content: string | null) => void;
}

export const DiagramEditor: FC<DiagramEditorProps> = ({
  manager,
  editor,
  setEditor,
  setIdTextCode,
  setElementCode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [nameState, setNameState] = useState<{ state: State; position: Rectangle }>();
  const [state, setState] = useState<{ state: State }>();
  const [events, setEvents] = useState<{ doComponent: string; doMethod: string }>();
  const [idEvents, setIdEvents] = useState<{ state: State; event: EventSelection }>();
  const [transition, setTransition] = useState<{ target: Condition }>();
  const [newTransition, setNewTransition] = useState<{ source: State; target: State }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const openEventsModal = () => setIsEventsModalOpen(true);
  const closeEventsModal = () => setIsEventsModalOpen(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const openMethodModal = () => setIsMethodModalOpen(true);
  const closeMethodModal = () => setIsMethodModalOpen(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuData, setContextMenuData] = useState<StateContextMenuData>();

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new CanvasEditor(containerRef.current, manager.state.data);
    const ClearUseState = () => {
      //Очищаем все старые данные
      setState(undefined);
      setEvents(undefined);
      setNameState(undefined);
      setTransition(undefined);
      setNewTransition(undefined);
    };
    // Закрытие контекстного меню
    editor.container.onContextMenuClose(() => {
      setIsContextMenuOpen(false);
    });

    //Обработка правой кнопки на пустом поле
    editor.container.onFieldContextMenu((pos) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };

      setContextMenuData({ data: null, canvasPos: pos, position, event: undefined });
      setIsContextMenuOpen(true);
    });

    //Перетаскиваем компонент в редактор
    editor.container.onStateDrop((position) => {
      editor?.container.machine.createNewState('Состояние', position);
    });

    //Здесь мы открываем модальное окно редактирования ноды
    editor.container.states.onStateNameCreate((state: State) => {
      const globalOffset = state.container.app.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
        width: state.computedWidth,
        height: state.titleHeight,
      };
      ClearUseState();
      setNameState({ state, position });
      openModal();
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
      setContextMenuData({ data: state, canvasPos: pos, position, event: undefined });
      setIsContextMenuOpen(true);
      // manager.triggerDataUpdate();
    });

    editor.container.states.onStateEventCreate((state, event) => {
      ClearUseState();
      setIdEvents({ state, event });
      openEventsModal();
    });

    editor.container.states.onEventContextMenu((state, pos, event) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      setContextMenuData({ data: state, canvasPos: pos, position, event });
      setIsContextMenuOpen(true);
    });

    //Здесь мы открываем модальное окно редактирования созданной связи
    editor.container.transitions.onTransitionCreate((target) => {
      ClearUseState();
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
      setContextMenuData({ data: condition, canvasPos: pos, position, event: undefined });
      setIsContextMenuOpen(true);
    });

    setEditor(editor);
    manager.watchEditor(editor);

    return () => {
      manager.unwatchEditor();
    };
    // FIXME: Агрессивный ESLint ругается, что containerRef не влияет
    // на перезапуск эффекта. Но это неправда. Хотя возможно, проблема
    // в архитектуре этого компонента.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  const handleCreateEventsModal = (data: CreateEventsModalFormValues) => {
    const doComponent = data.doComponent;
    const doMethod = data.doMethod;
    setEvents({ doComponent, doMethod });
    if (!isModalOpen) {
      editor?.container.machine.createEvent(data.id, doComponent, doMethod);
    }
    closeEventsModal();
  };

  const handleCreateModal = (data: CreateModalFormValues) => {
    if (data.key === 1) {
      editor?.container.machine.updateState(data.id, data.name);
    } else if (data.key === 2) {
      editor?.container.machine.newPictoState(
        data.id,
        events!.doComponent,
        events!.doMethod,
        data.triggerComponent,
        data.triggerMethod
      );
    } else if (transition && data.key === 3) {
      editor?.container.machine.createNewTransition(
        transition?.target.id,
        transition?.target.transition.source,
        transition?.target.transition.target,
        data.color,
        data.doComponent,
        data.doMethod,
        transition?.target.bounds
      );
    } else if (newTransition) {
      editor?.container.machine.createNewTransition(
        undefined,
        newTransition?.source,
        newTransition?.target,
        data.color,
        data.doComponent,
        data.doMethod,
        newTransition?.target.bounds
      );
    }
    closeModal();
  };

  const contextMenuCallbacks = {
    onClickNewState: (pos: Point) => {
      editor?.container.machine.createNewState('Состояние', pos);
    },
    onClickInitial: (data: ContextMenuForm) => {
      editor?.container.machine.changeInitialState(data.id);
    },
    onClickShowCode: (data: ContextMenuForm) => {
      setIdTextCode(data.id);
      setElementCode(data.content);
      setIsContextMenuOpen(false);
    },
    onClickDelState: (data: ContextMenuForm) => {
      editor?.container.machine.deleteState(data.id);
    },
    onClickDelTran: (data: ContextMenuForm) => {
      editor?.container.machine.deleteTransition(data.id);
    },
    onClickDelEvent: (data: ContextMenuForm) => {
      editor?.container.machine.deleteEvent(data.id, data.eventId);
    },
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}>
        <StateContextMenu
          isOpen={isContextMenuOpen}
          isData={contextMenuData}
          callbacks={contextMenuCallbacks}
          closeMenu={() => {
            setIsContextMenuOpen(false);
          }}
        />
      </div>

      <CreateEventsModal
        isOpen={isEventsModalOpen}
        isData={idEvents}
        onClose={closeEventsModal}
        onSubmit={handleCreateEventsModal}
        title={'Редактирование события'}
      />

      <CreateMethodModal
        isOpen={isMethodModalOpen}
        isData={idEvents}
        onClose={closeMethodModal}
        onSubmit={handleCreateEventsModal}
        title={'Добавление действий'}
      />

      {isModalOpen ? (
        <CreateModal
          editor={editor}
          isOpen={isModalOpen}
          onOpenMethodModal={openMethodModal}
          isData={state}
          isName={nameState}
          onClose={closeModal}
          onSubmit={handleCreateModal}
        />
      ) : (
        ''
      )}
    </>
  );
};
