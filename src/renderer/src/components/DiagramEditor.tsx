import React, { useEffect, useRef, useState } from 'react';
import { Elements } from '@renderer/types/diagram';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { CreateStateModal, CreateStateModalFormValues } from './CreateStateModal';
import { Point } from '@renderer/types/graphics';
import { CreateTransitionModal, CreateTransitionModalFormValues } from './CreateTransitionModal';
import { State } from '@renderer/lib/drawable/State';

interface DiagramEditorProps {
  elements: Elements;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [statePos, setStatePos] = useState<Point>({ x: 0, y: 0 });
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

    editor?.container?.onStateDrop((position) => {
      setStatePos(position);
      openStateModal();
    });

    editor.container.transitions.onTransitionCreate((source, target) => {
      setTransition({ source, target });
      openTransitionModal();
    });

    setEditor(editor);

    return () => editor.cleanUp();
  }, [containerRef.current]);

  const handleCreateState = (data: CreateStateModalFormValues) => {
    editor?.container.states.createNewState(data.name, statePos);

    closeStateModal();
  };

  const handleCreateTransition = (data: CreateTransitionModalFormValues) => {
    if (transition) {
      editor?.container.transitions.createNewTransition(
        transition.source,
        transition.target,
        data.component,
        data.method,
        data.color
      );
    }

    closeTransitionModal();
  };

  return (
    <>
      <div className="relative h-full flex-1 overflow-hidden bg-neutral-800" ref={containerRef} />
      <CreateStateModal
        isOpen={isStateModalOpen}
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
