import React, { useEffect, useRef, useState } from 'react';
import { ElementDefinition } from 'cytoscape';

import Rect from '../assets/rect.svg';
import { CyEditor } from '@renderer/lib/CyEditor';

interface DiagramEditorProps {
  elements: ElementDefinition[];
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const cyContainerRef = useRef<HTMLDivElement>(null);

  const [cyEditor, setCyEditor] = useState<CyEditor | null>(null);

  useEffect(() => {
    if (!cyContainerRef.current) return;

    setCyEditor(new CyEditor(cyContainerRef.current, elements));
  }, [cyContainerRef.current]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLDivElement).dataset.id;
    if (id) {
      e.dataTransfer.setData('id', id);
    }
  };

  return (
    <div className="w-full h-[90vh] border border-neutral-800 rounded flex items-stretch">
      <aside className="px-4 py-2 border-r border-black w-48">
        <img src={Rect} draggable onDragStart={handleDragStart} />
        <button onClick={() => console.log((cyEditor?.cy.json() as any)?.elements)}>
          Elements
        </button>
      </aside>
      <div className="flex-1 z-50 overflow-hidden bg-neutral-900" ref={cyContainerRef} />
    </div>
  );
};
