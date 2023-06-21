import Konva from 'konva';
import { getBoxToBoxArrow } from 'curved-arrows';
import { v4 as uuidv4 } from 'uuid';
import { Elements, State } from '@renderer/types';

export class KonvaEditor {
  container!: HTMLDivElement;
  stage!: Konva.Stage;
  layer!: Konva.Layer;

  states: Map<string, State> = new Map();

  selectedStateId: null | string = null;

  constructor(container: HTMLDivElement, width: number, height: number, elements: Elements) {
    this.container = container;

    this.stage = new Konva.Stage({
      container,
      width,
      height,
    });

    this.layer = new Konva.Layer();

    for (const id in elements.states) {
      const { x, y, width, height, events } = elements.states[id];

      this.drawState(id, x, y, width, height);

      this.states.set(id, { x, y, width, height, events });
    }

    for (const id in elements.transitions) {
      const { source, target } = elements.transitions[id];

      this.drawEdge(id, source, target);
    }

    this.stage.add(this.layer);
  }

  drawState = (id: string, x: number, y: number, width: number, height: number) => {
    const group = new Konva.Group({
      draggable: true,
      id,
      x,
      y,
    });

    const box = new Konva.Shape({
      fill: '#2D2E34',
      stroke: this.selectedStateId === id ? 'white' : 'black',
      strokeWidth: this.selectedStateId === id ? 1 : 0,
      sceneFunc(ctx, shape) {
        ctx.beginPath();

        // ctx.moveTo(x, y);
        ctx.rect(0, 0, width, height);
        // ctx.rect(x, y, width, height);
        // ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);

        ctx.fillStrokeShape(shape);
      },
    });

    // const box = new Konva.Rect({
    //   width,
    //   height,

    // });

    const text = new Konva.Text({
      x: width / 2,
      y: height / 2,
      text: id,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#FFF',
    });

    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);

    group.on('mouseover', () => {
      // box.setAttr('strokeWidth', 2);

      document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', () => {
      // box.setAttr('strokeWidth', 0);

      document.body.style.cursor = 'default';
    });
    group.on('dragstart', () => {
      document.body.style.cursor = 'grabbing';
    });
    group.on('dragend', () => {
      document.body.style.cursor = 'pointer';
    });
    group.on('dragmove', (e) => {
      const prevState = this.states.get(id);

      if (!prevState) return;

      prevState.x = e.target.attrs.x;
      prevState.y = e.target.attrs.y;

      document.body.style.cursor = 'grab';
    });
    group.on('click', () => {
      this.selectedStateId = id;

      box.setAttr('stroke', 'white');
      box.setAttr('strokeWidth', 2);

      box.setAttr('selected', true);

      box.draw();
    });

    group.add(box);
    group.add(text);

    this.layer.add(group);
  };

  drawEdge = (id: string, source: string, target: string) => {
    const edge = new Konva.Shape({
      stroke: '#FFF',
      strokeWidth: 2,
      source,
      target,
      id,
      sceneFunc: (ctx, shape) => {
        const p1 = this.states.get(shape.attrs.source);
        const p2 = this.states.get(shape.attrs.target);

        if (!p1 || !p2) return;

        const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrow(
          p1.x,
          p1.y,
          p1.width,
          p1.height,
          p2.x,
          p2.y,
          p2.width,
          p2.height,
          {
            padEnd: 0,
          }
        );

        ctx.beginPath();

        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);

        ctx.fillStrokeShape(shape);
      },
    });

    this.layer.add(edge);
  };

  initEvents = () => {
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();

      this.stage.setPointersPositions(e);
      const pos = this.stage.getPointerPosition();

      if (!pos) return;

      this.drawState(uuidv4(), pos.x, pos.y, 100, 50);
    });
  };
}
