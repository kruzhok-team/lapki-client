import React, { useEffect, useRef, useState } from 'react';
import { Elements } from '@renderer/types/diagram';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { CreateStateModal, CreateStateModalFormValues } from './CreateStateModal';
import { CreateTransitionModal, CreateTransitionModalFormValues } from './CreateTransitionModal';
import { State } from '@renderer/lib/drawable/State';

interface DiagramEditorProps {
  elements: Elements;
}
export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [state, setState] = useState<{ state: State }>();

  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const openStateModal = () => setIsStateModalOpen(true);
  const closeStateModal = () => setIsStateModalOpen(false);

  const [transition, setTransition] = useState<{ source: State; target: State } | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const openTransitionModal = () => setIsTransitionModalOpen(true);
  const closeTransitionModal = () => setIsTransitionModalOpen(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new CanvasEditor(containerRef.current, elements);
    let i: number = 0;

    //Добавляем пустую ноду в редактор
    editor?.container?.onStateDrop((position) => {
      i = i + 1;
      editor?.container.states.createNewState('Состояние ' + i, position);
      localStorage.setItem('Data', JSON.stringify(editor.container.graphData));
    });

    //Здесь мы открываем модальное окно редактирования ноды
    editor.container.states.onStateCreate((state) => {
      setState({ state });
      openStateModal();
      localStorage.setItem('Data', JSON.stringify(editor.container.graphData));
    });

    //Здесь мы открываем модальное окно редактирования связи
    editor.container.transitions.onTransitionCreate((source, target) => {
      setTransition({ source, target });
      openTransitionModal();
      localStorage.setItem('Data', JSON.stringify(editor.container.graphData));
    });

    //Таймер для сохранения изменений сделанных в редакторе
    const SaveEditor = setInterval(() => {
      localStorage.setItem('Data', JSON.stringify(editor.container.graphData));
    }, 5000);
    setEditor(editor);

    return () => {
      editor.cleanUp();
      clearInterval(SaveEditor);
    };
  }, [containerRef.current]);

  const handleCreateState = (data: CreateStateModalFormValues) => {
    editor?.container.states.createState(data.name, data.events, data.component, data.method);
    closeStateModal();
  };

  const handleCreateTransition = (data: CreateTransitionModalFormValues) => {
    if (transition) {
      editor?.container.transitions.createNewTransition(
        transition.source,
        transition.target,
        data.color,
        data.component,
        data.method
      );
    }
    closeTransitionModal();
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef} />

      <CreateStateModal
        isOpen={isStateModalOpen}
        onOpen={state}
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
