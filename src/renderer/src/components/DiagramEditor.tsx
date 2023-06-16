import React, { useEffect, useRef } from 'react';
import cytoscape, { ElementDefinition } from 'cytoscape';

interface DiagramEditorProps {
  elements: ElementDefinition[];
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const cyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cytoscape({
      container: cyRef.current,

      elements,

      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            label: 'data(id)'
          }
        },

        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],

      zoom: 0.5,
      maxZoom: 1.5,
      minZoom: 0.5,

      layout: { name: 'grid' }
    });

    const container = cy.container();

    if (!container) return;

    let handler = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      const canvas = e.target as HTMLCanvasElement;

      const shapeId = e.dataTransfer?.getData('id');

      const pos = canvas.compareDocumentPosition(container);

      if (pos === 10) {
        let rect = { x: e.offsetX, y: e.offsetY };

        let panZoom = { pan: cy.pan(), zoom: cy.zoom() };
        let x = (rect.x - panZoom.pan.x) / panZoom.zoom;
        let y = (rect.y - panZoom.pan.y) / panZoom.zoom;
        rect = { x, y };

        const node: ElementDefinition = {
          group: 'nodes',
          data: { id: shapeId },
          position: rect
        };

        cy.add([node]);
      }
    };

    console.log(container);

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragenter', handler);
    container.addEventListener('dragover', handler);

    return () => {
      console.log('container remove');
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragenter', handler);
      container.removeEventListener('dragover', handler);
    };
  }, [elements, cyRef.current]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // e.preventDefault();

    const id = (e.target as HTMLDivElement).dataset.id;
    if (id) {
      e.dataTransfer.setData('id', id);
    }
  };

  return (
    <div className="w-full h-[90vh] border border-neutral-800 rounded flex items-stretch">
      <aside className="px-4 py-2 border-r border-black w-48">
        <div
          className="border border-black rounded-xl p-2 shape-item"
          draggable
          data-id={0}
          onDragStart={handleDragStart}
        >
          node
        </div>
      </aside>
      <div className="flex-1 z-50 overflow-hidden" ref={cyRef} />
    </div>
  );
};
