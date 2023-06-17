import { Core, ElementDefinition } from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';

import Rect from '../assets/rect.svg';

export class DragAddNodes {
  cy!: Core;

  constructor(cy: Core) {
    this.cy = cy;

    const container = cy?.container();

    if (!container) return;

    let handler = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      const canvas = e.target as HTMLCanvasElement;

      const pos = canvas.compareDocumentPosition(container);

      if (pos === 10) {
        let rect = { x: e.offsetX, y: e.offsetY };

        let panZoom = { pan: cy.pan(), zoom: cy.zoom() };
        let x = (rect.x - panZoom.pan.x) / panZoom.zoom;
        let y = (rect.y - panZoom.pan.y) / panZoom.zoom;
        rect = { x, y };

        const node: ElementDefinition = {
          group: 'nodes',
          data: {
            id: uuidv4(),
            image: Rect,
            bg: '#1890FF',
            width: 88,
            height: 56,
            type: 'round-rectangle'
          },
          position: rect
        };

        cy.add([node]);
      }
    };

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragenter', handler);
    container.addEventListener('dragover', handler);
  }
}

export default function register(cy?: any): void {
  if (!cy) {
    return;
  }

  cy('core', 'dragAddNodes', function (this: any) {
    return new DragAddNodes(this);
  });
}

// Automatically register the extension for browser
declare global {
  interface Window {
    cytoscape?: any;
  }
}

if (typeof window.cytoscape !== 'undefined') {
  register(window.cytoscape);
}

// Extend cytoscape.Core
import 'cytoscape';

declare module 'cytoscape' {
  interface Core {
    dragAddNodes(): void;
  }
}
