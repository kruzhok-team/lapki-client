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

      style: [
        {
          selector: 'node',
          style: {
            label: 'data(id)'
          }
        },

        {
          selector: 'node:parent',
          style: {
            label: ''
          }
        },

        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle'
          }
        },

        {
          selector: '.cdnd-grabbed-node',
          style: {
            'background-color': 'red'
          }
        },

        {
          selector: '.cdnd-drop-sibling',
          style: {
            'background-color': 'red'
          }
        },

        {
          selector: '.cdnd-drop-target',
          style: {
            'border-color': 'red',
            'border-style': 'dashed'
          }
        }
      ],

      zoom: 0.5,
      maxZoom: 1.5,
      minZoom: 0.5,

      layout: { name: 'grid' }
    });

    console.log(cy);
  }, [elements, containerRef.current]);

  return <div className="w-full h-[90vh] border border-neutral-800 rounded" ref={containerRef} />;
};
