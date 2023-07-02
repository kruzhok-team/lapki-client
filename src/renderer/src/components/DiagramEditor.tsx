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

  return <div className="h-[95vh] w-[92vw] overflow-hidden bg-neutral-800" ref={containerRef} />;
};
