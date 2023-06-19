import React, { useEffect, useRef, useState } from 'react';
// import { ElementDefinition } from 'cytoscape';
import useMeasure from 'react-use-measure';
import { mergeRefs } from 'react-merge-refs';
import { KonvaEditor } from '@renderer/lib/KonvaEditor';

// import { CyEditor } from '@renderer/lib/CyEditor';

interface DiagramEditorProps {
  elements: any;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ref, bounds] = useMeasure();

  const [editor, setEditor] = useState<KonvaEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setEditor(new KonvaEditor(containerRef.current, bounds.width, bounds.height, elements));

    // setCyEditor(new CyEditor(cyContainerRef.current, elements));
  }, [containerRef.current]);

  // const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
  //   const id = (e.target as HTMLDivElement).dataset.id;
  //   if (id) {
  //     e.dataTransfer.setData('id', id);
  //   }
  // };

  return (
    <div className="flex h-full w-full">
      <aside className="w-64 border-r border-neutral-500 bg-neutral-900 p-4">
        <button
          className="mb-4 rounded-sm bg-neutral-50 px-2 py-1 text-neutral-800"
          // onClick={() => console.log((cyEditor?.cy.json() as any)?.elements)}
        >
          Elements
        </button>

        {/* <div
          className="grid h-[50px] w-[100px] place-items-center bg-[#2D2E34] text-neutral-50"
          draggable
          onDragStart={handleDragStart}
        >
          State
        </div> */}
      </aside>
      <div
        className="z-50 flex-1 overflow-hidden bg-neutral-800"
        ref={mergeRefs([ref, containerRef])}
      />
    </div>
  );
};
