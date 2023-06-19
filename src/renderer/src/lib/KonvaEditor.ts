import Konva from 'konva';
import { getBoxToBoxArrow } from 'curved-arrows';

export class KonvaEditor {
  stage!: Konva.Stage;

  constructor(container: HTMLDivElement, width: number, height: number, elements: any) {
    const nodes = elements.nodes;
    const edges = elements.edges;

    this.stage = new Konva.Stage({
      container,
      width,
      height,
    });

    const layer = new Konva.Layer();

    nodes.forEach(({ x, y, width, height, id }) => {
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
      layer.add(group);
    });

    edges.forEach(({ source, target, id }) => {
      const rect = new Konva.Shape({
        stroke: '#FFF',
        strokeWidth: 2,
        source,
        target,
        id,
        sceneFunc: function (ctx, shape) {
          const p1 = layer.findOne(`#${shape.attrs.source}`);
          const p2 = layer.findOne(`#${shape.attrs.target}`);

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
          // ctx.lineTo(ex - 10, ey - 10);
          // ctx.lineTo(ex + 10, ey + 10);

          ctx.fillStrokeShape(shape);
        },
      });
      layer.add(rect);

      const bezierLinePath = new Konva.Line({
        dash: [10, 10, 0, 10],
        strokeWidth: 3,
        stroke: 'black',
        lineCap: 'round',
        id: 'bezierLinePath',
        opacity: 0.3,
        points: [0, 0],
        source,
        target,
      });

      layer.add(bezierLinePath);
    });

    this.stage.add(layer);
  }
}
