import { Stylesheet } from 'cytoscape';

export const style: Stylesheet[] = [
  {
    selector: 'node[type]',
    style: {
      shape: 'data(type)' as any,
      height: 'data(height)',
      width: 'data(width)',
      'text-valign': 'center',
      'text-halign': 'center',
      'background-color': '#2D2E34',
      color: '#FFF',
      'border-width': 1,
      'background-opacity': 0.5,
      'border-opacity': 0
    }
  },
  {
    selector: 'node[name]',
    style: {
      label: 'data(name)'
    }
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#FFF',
      'border-opacity': 1
    }
  },
  {
    selector: 'node:active',
    style: {
      'overlay-opacity': 0
    }
  },

  {
    selector: 'edge',
    style: {
      'curve-style': 'taxi',
      'target-arrow-shape': 'triangle',
      width: 2
    }
  },

  {
    selector: '.eh-handle',
    style: {
      'background-color': 'red',
      width: 12,
      height: 12,
      shape: 'ellipse',
      'overlay-opacity': 0,
      'border-width': 12, // makes the handle easier to hit
      'border-opacity': 0
    }
  },

  {
    selector: '.eh-hover',
    style: {
      'background-color': 'red'
    }
  },

  {
    selector: '.eh-source',
    style: {
      'border-width': 2,
      'border-color': 'red'
    }
  },

  {
    selector: '.eh-target',
    style: {
      'border-width': 2,
      'border-color': 'red'
    }
  },

  {
    selector: '.eh-preview, .eh-ghost-edge',
    style: {
      'background-color': 'red',
      'line-color': 'red',
      'target-arrow-color': 'red',
      'source-arrow-color': 'red'
    }
  },

  {
    selector: '.eh-ghost-edge.eh-preview-active',
    style: {
      opacity: 0
    }
  }
];
