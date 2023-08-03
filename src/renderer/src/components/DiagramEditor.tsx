import { FC, useEffect, useRef, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { Point } from '@renderer/types/graphics';

import { CreateStateModal, CreateStateModalFormValues } from './CreateStateModal';
import { CreateTransitionModal, CreateTransitionModalFormValues } from './CreateTransitionModal';
import { ContextMenu, StateContextMenu, StateContextMenuData } from './StateContextMenu';

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

  const [state, setState] = useState<{ state: State }>();
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const openStateModal = () => setIsStateModalOpen(true);
  const closeStateModal = () => setIsStateModalOpen(false);

  const [transition, setTransition] = useState<{ source: State; target: State } | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const openTransitionModal = () => setIsTransitionModalOpen(true);
  const closeTransitionModal = () => setIsTransitionModalOpen(false);

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
      setState({ state });
      openStateModal();
      // manager.triggerDataUpdate();
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
    editor.container.transitions.onTransitionCreate((source, target) => {
      setTransition({ source, target });
      openTransitionModal();
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

  const handleCreateState = (data: CreateStateModalFormValues) => {
    editor?.container.machine.updateState(
      data.id,
      data.newName,
      data.events,
      data.component,
      data.method
    );
    closeStateModal();
  };

  const handleCreateTransition = (data: CreateTransitionModalFormValues) => {
    if (transition) {
      editor?.container.machine.createNewTransition(
        transition.source,
        transition.target,
        data.color,
        data.component,
        data.method
      );
    }
    closeTransitionModal();
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

      <CreateStateModal
        isOpen={isStateModalOpen}
        isData={state}
        onClose={closeStateModal}
        onSubmit={handleCreateState}
      />

      <CreateTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={closeTransitionModal}
        onSubmit={handleCreateTransition}
      />
    </>
  );
};
