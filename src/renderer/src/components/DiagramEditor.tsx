import React, { useEffect, useRef } from 'react';
import { Elements } from '@renderer/types/diagram';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

interface DiagramEditorProps {
  elements: Elements;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new CanvasEditor(containerRef.current, elements);

    return () => editor.cleanUp();
  }, [containerRef.current]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex bg-[#4391BF] font-Fira text-[calc(4.5vh/2)] bg-opacity-50 w-[calc(22vw/2)] h-[5vh] text-center">
        <p>

        </p>
        <button className={`ml-[0.5vw]`}>
          Справка
        </button>
      </div>

      <div className="z-50 h-[95vh] overflow-hidden bg-neutral-800" ref={containerRef} />
    </div>
  );
};
