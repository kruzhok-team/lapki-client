import { Stylesheet } from 'cytoscape';

export const style: Stylesheet[] = [
  {
    selector: 'node[type]',
    style: {
      shape: 'data(type)' as any,
      // label: 'data(type)',
      height: 'data(height)',
      width: 'data(width)',
      'text-valign': 'center',
      'text-halign': 'center'
    }
  },
  {
    selector: 'node[name]',
    style: {
      content: 'data(name)'
    }
  },
  {
    selector: 'node[image]',
    style: {
      'background-opacity': 0,
      'background-fit': 'cover',
      'background-image': (e) => e.data('image') || { value: '' }
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
