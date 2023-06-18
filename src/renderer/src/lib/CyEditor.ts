import cytoscape, { Core, ElementDefinition, NodeSingular } from 'cytoscape';

import popper from 'cytoscape-popper';
import edgehandles from 'cytoscape-edgehandles';
import dragAddNodes from './dragAddNodes';

import { style } from './cyStyles';

cytoscape.use(popper);
cytoscape.use(edgehandles);
cytoscape.use(dragAddNodes);

export class CyEditor {
  cy!: Core;

  constructor(container: HTMLDivElement, elements: ElementDefinition[]) {
    this.cy = cytoscape({
      container,
      elements,
      style,

      zoom: 0.5,
      maxZoom: 1.5,
      minZoom: 0.5,

      layout: { name: 'grid' },
    });

    this.cy.dragAddNodes();

    const eh = this.cy.edgehandles({
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
      disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    });

    // e.enableDrawMode();

    type PopperDiv = HTMLDivElement | null;

    let poppers: [any, any, any, any] = [null, null, null, null];
    let popperDivs: [PopperDiv, PopperDiv, PopperDiv, PopperDiv] = [null, null, null, null];

    this.cy.on('select', 'node', (e) => {
      const node = e.target as NodeSingular;

      for (let i = 0; i < 4; i++) {
        let position = 'top';
        if (i === 1) position = 'left';
        if (i === 2) position = 'right';
        if (i === 3) position = 'bottom';

        poppers[i] = node.popper({
          content: () => {
            const popperDiv = document.createElement('div');

            popperDiv.classList.add('popper-handle');
            popperDiv.innerText = '+';
            popperDiv.addEventListener('mousedown', () => eh.start(node as any as string));

            document.body.appendChild(popperDiv);

            popperDivs[i] = popperDiv;

            return popperDiv;
          },
          popper: {
            strategy: 'absolute',
            placement: position as any,
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 5],
                },
              },
            ],
          },
        });

        node.on('drag', () => {
          const div = popperDivs[i];
          if (div) {
            div.style.opacity = '0';
          }
          poppers[i].update();
        });

        node.on('dragfree', () => {
          const div = popperDivs[i];
          if (div) {
            div.style.opacity = '1';
          }
        });
      }
    });

    this.cy.on('unselect', 'node', () => {
      poppers.forEach((p) => p?.destroy());

      popperDivs.forEach((c) => c && document.body.removeChild(c));
    });

    // ? Не знаю почему так не работает
    // this.cy.on('mouseup', () => eh.stop());
    window.addEventListener('mouseup', () => eh.stop());
  }
}
