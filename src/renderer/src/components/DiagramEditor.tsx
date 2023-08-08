import { FC, useEffect, useRef, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { Point, Rectangle } from '@renderer/types/graphics';

import { CreateModal, CreateModalFormValues } from './CreateModal';

import { ContextMenu, StateContextMenu, StateContextMenuData } from './StateContextMenu';
import { CreateEventsModal, CreateEventsModalFormValues } from './CreateEventsModal';

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
  const [transition, setTransition] = useState<{ target: Condition } | null>(null);
  const [newTransition, setNewTransition] = useState<{ source: State; target: State } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const openEventsModal = () => setIsEventsModalOpen(true);
  const closeEventsModal = () => setIsEventsModalOpen(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuData, setContextMenuData] = useState<StateContextMenuData>();

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new CanvasEditor(containerRef.current, manager.state.data);

    //Добавляем пустую ноду в редактор
    editor.container.onStateDrop((position) => {
      editor?.container.machine.createNewState('Состояние', position);
    });

    //Здесь мы открываем модальное окно редактирования ноды
    editor.container.states.onStateCreate((state) => {
      setNameState(undefined);
      setTransition(null);
      setEvents(undefined);
      setState({ state });
      openModal();
      // manager.triggerDataUpdate();
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
      setState(undefined);
      setEvents(undefined);
      setTransition(null);
      setNameState({ state, position });
      openModal();
    });

    //Обработка правой кнопки на пустом поле
    editor.container.onFieldContextMenu((pos) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      setContextMenuData({ data: null, position });
      setIsContextMenuOpen(true);
    });

    // Закрытие контекстного меню
    editor.container.onContextMenuClose(() => {
      setIsContextMenuOpen(false);
    });

    //Здесь мы открываем контекстное меню для состояния
    editor.container.states.onStateContextMenu((state: State, pos) => {
      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      setContextMenuData({ data: state, position });
      setIsContextMenuOpen(true);
      // manager.triggerDataUpdate();
    });

    //Здесь мы открываем модальное окно редактирования связи
    editor.container.transitions.onTransitionCreate((target) => {
      setState(undefined);
      setEvents(undefined);
      setNameState(undefined);
      setNewTransition(null);
      setTransition({ target });
      openModal();
      // manager.triggerDataUpdate();
    });

    //Здесь мы открываем модальное окно редактирования новой связи
    editor.container.transitions.onNewTransitionCreate((source, target) => {
      setState(undefined);
      setEvents(undefined);
      setNameState(undefined);
      setTransition(null);
      setNewTransition({ source, target });
      openModal();
      // manager.triggerDataUpdate();
    });

    //Здесь мы открываем контекстное меню для связи
    editor.container.transitions.onTransitionContextMenu((condition: Condition, pos: Point) => {
      console.log(['handleContextMenu', condition]);

      const offset = editor.mouse.getOffset();
      const position = { x: pos.x + offset.x, y: pos.y + offset.y };
      setContextMenuData({ data: condition, position });
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
    openModal();
    closeEventsModal();
  };

  const handleCreateModal = (data: CreateModalFormValues) => {
    if (data.key === 1) {
      editor?.container.machine.newPictoState(
        data.id,
        events!.doComponent,
        events!.doMethod,
        data.triggerComponent,
        data.triggerMethod
      );
    } else if (data.key === 2) {
      editor?.container.machine.updateState(data.id, data.name);
    } else if (transition) {
      editor?.container.machine.createNewTransition(
        transition?.target.id,
        transition?.target.transition.source,
        transition?.target.transition.target,
        data.color,
        events!.doComponent,
        events!.doMethod,
        transition?.target.bounds
      );
    } else if (newTransition) {
      editor?.container.machine.createNewTransition(
        undefined,
        newTransition?.source,
        newTransition?.target,
        data.color,
        data.triggerComponent,
        data.triggerMethod,
        newTransition?.target.bounds
      );
    }
    closeModal();
  };

  const handleinitialState = (data: ContextMenu) => {
    editor?.container.machine.changeInitialState(data.id);
  };

  const handleShowCode = (data: ContextMenu) => {
    setIdTextCode(data.id);
    setElementCode(data.content);
    setIsContextMenuOpen(false);
  };

  const handleDeleteState = (data: ContextMenu) => {
    editor?.container.machine.deleteState(data.id);
  };

  const handleDelTranState = (data: ContextMenu) => {
    editor?.container.machine.deleteTransition(data.id);
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}>
        <StateContextMenu
          isOpen={isContextMenuOpen}
          isData={contextMenuData}
          onClickDelState={handleDeleteState}
          onClickInitial={handleinitialState}
          onClickDelTran={handleDelTranState}
          onClickShowCode={handleShowCode}
          closeMenu={() => {
            setIsContextMenuOpen(false);
          }}
        />
      </div>

      <CreateEventsModal
        isOpen={isEventsModalOpen}
        onClose={closeEventsModal}
        onSubmit={handleCreateEventsModal}
        title={'Выбор события'}
      />

      {isModalOpen ? (
        <CreateModal
          editor={editor}
          isOpen={isModalOpen}
          onOpenEventsModal={openEventsModal}
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
