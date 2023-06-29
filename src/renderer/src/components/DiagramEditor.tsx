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
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[5vh] w-[calc(22vw/2)] bg-[#4391BF] bg-opacity-50 text-center font-Fira text-[calc(4.5vh/2)]">
        <p></p>
        <button className={`ml-[0.5vw]`}>Справка</button>
      </div>

      <div className="z-50 h-[95vh] overflow-hidden bg-neutral-800" ref={containerRef} />
    </div>
  );
};
