import React, { useEffect, useRef, useState } from 'react';
import { Elements } from '@renderer/types/diagram';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { CreateStateModal, CreateStateModalFormValues } from './CreateStateModal';
import { Point } from '@renderer/types/graphics';

interface DiagramEditorProps {
  elements: Elements;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [statePos, setStatePos] = useState<Point>({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new CanvasEditor(containerRef.current, elements);

    editor?.container?.onStateDrop((position) => {
      setStatePos(position);
      open();
    });

    setEditor(editor);

    return () => editor.cleanUp();
  }, [containerRef.current]);

  const handleCreateState = (data: CreateStateModalFormValues) => {
    editor?.container.states.createNewState(data.name, statePos);

    close();
  };

  return (
    <>
      <div className="h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>
      <CreateStateModal isOpen={isOpen} onClose={close} onSubmit={handleCreateState} />
    </>
  );
};
