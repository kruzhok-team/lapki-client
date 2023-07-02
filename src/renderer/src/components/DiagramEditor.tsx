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
    <div className="flex h-full w-full">
      <aside className="w-64 border-r border-neutral-500 bg-neutral-900 p-4">
        <button
          className="mb-4 rounded-sm bg-neutral-50 px-2 py-1 text-neutral-800"
          onClick={() => console.log(editor?.container.graphData)}
        >
          Elements
        </button>

        <div
          className="grid h-[50px] w-[100px] place-items-center bg-neutral-700 text-neutral-50"
          draggable
        >
          State
        </div>
      </aside>

      <div className="flex-1 overflow-hidden bg-neutral-800" ref={containerRef} />

      <CreateStateModal isOpen={isOpen} onClose={close} onSubmit={handleCreateState} />
    </div>
  );
};
