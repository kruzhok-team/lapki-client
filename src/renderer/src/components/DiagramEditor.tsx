import React, { useEffect, useRef, useState } from 'react';
import { Elements } from '@renderer/types/diagram';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

interface DiagramEditorProps {
  elements: Elements;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<CanvasEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = new CanvasEditor(containerRef.current, elements);

    setEditor(editor);

    return () => editor.cleanUp();
  }, [containerRef.current]);

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
      <div className="z-50 flex-1 overflow-hidden bg-neutral-800" ref={containerRef} />
    </div>
  );
};
