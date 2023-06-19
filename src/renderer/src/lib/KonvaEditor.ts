import Konva from 'konva';
import { getBoxToBoxArrow } from 'curved-arrows';
import { v4 as uuidv4 } from 'uuid';

export class KonvaEditor {
  stage!: Konva.Stage;
  layer!: Konva.Layer;

  constructor(container: HTMLDivElement, width: number, height: number, elements: any) {
    const nodes = elements.nodes;
    const edges = elements.edges;

    this.stage = new Konva.Stage({
      container,
      width,
      height,
    });

    this.layer = new Konva.Layer();

    nodes.forEach(({ x, y, width, height, id }) => {
      this.drawState(id, x, y, width, height);
    });

    edges.forEach(({ source, target, id }) => {
      const edge = new Konva.Shape({
        stroke: '#FFF',
        strokeWidth: 2,
        source,
        target,
        id,
        sceneFunc: (ctx, shape) => {
          const p1 = this.layer.findOne(`#${shape.attrs.source}`);
          const p2 = this.layer.findOne(`#${shape.attrs.target}`);

          const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrow(
            p1.x(),
            p1.y(),
            p1.width(),
            p1.height(),
            p2.x(),
            p2.y(),
            p2.width(),
            p2.height(),
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
    });

    this.stage.add(this.layer);

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();

      this.stage.setPointersPositions(e);
      const pos = this.stage.getPointerPosition();

      if (!pos) return;

      this.drawState(uuidv4(), pos.x, pos.y, 100, 50);
    });
  }

  drawState = (id: string, x: number, y: number, width: number, height: number) => {
    const group = new Konva.Group({
      draggable: true,
      id,
      x,
      y,
      width,
      height,
    });

    const box = new Konva.Rect({
      width,
      height,
      fill: '#2D2E34',
      stroke: 'black',
      strokeWidth: 0,
    });

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
      box.setAttr('strokeWidth', 2);

      document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', () => {
      box.setAttr('strokeWidth', 0);

      document.body.style.cursor = 'default';
    });

    group.add(box);
    group.add(text);

    this.layer.add(group);
  };
}
