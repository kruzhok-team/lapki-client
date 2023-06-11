import React, { useEffect, useRef } from 'react';
import cytoscape, { ElementDefinition } from 'cytoscape';

interface DiagramEditorProps {
  elements: ElementDefinition[];
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,

      elements,

      // elements: [
      //   { data: { id: 'a' } },
      //   { data: { id: 'b' } },
      //   { data: { id: 'ab', source: 'a', target: 'b' } }
      // ],

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

      layout: { name: 'grid' }
    });

    console.log(cy);
  }, [elements, containerRef.current]);

  return <div className="w-full h-[90vh] border border-neutral-800 rounded" ref={containerRef} />;
};
