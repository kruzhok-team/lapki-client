import cytoscape, { Core, ElementDefinition } from 'cytoscape';

import edgehandles from 'cytoscape-edgehandles';
import dragAddNodes from './dragAddNodes';

import { style } from './cyStyles';

cytoscape.use(edgehandles);
cytoscape.use(dragAddNodes);

export class CyEditor {
  cy!: Core;

  constructor(container: HTMLDivElement, elements: ElementDefinition[]) {
    this.cy = cytoscape({
      container,
      elements,
      style,

      zoom: 1,
      maxZoom: 1.5,
      minZoom: 0.5,

      layout: { name: 'grid' }
    });

    this.cy.dragAddNodes();

    const e = this.cy.edgehandles({
      canConnect: function (sourceNode, targetNode) {
        // whether an edge can be created between source and target
        return !sourceNode.same(targetNode); // e.g. disallow loops
      },
      edgeParams: function (sourceNode, targetNode) {
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for edge
        return { data: {} };
      },
      hoverDelay: 150, // time spent hovering over a target node before it is considered selected
      snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
      snapThreshold: 1, // the target node must be less than or equal to this many pixels away from the cursor/finger
      snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
      noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
      disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    });

    e.enableDrawMode();
  }
}
