import Konva from 'konva';

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

      group.on('dragmove', (e) => {
        this.reDrawEdges(e.target);
      });

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
      const sourceNode = nodes.find(({ id }) => id === source);
      const targetNode = nodes.find(({ id }) => id === target);

      const sourceX = sourceNode.x + sourceNode.width / 2;
      const sourceY = sourceNode.y + sourceNode.height / 2;
      const targetX = targetNode.x + targetNode.width / 2;
      const targetY = targetNode.y + targetNode.height / 2;

      const arrow = new Konva.Arrow({
        points: [sourceX, sourceY, targetX, targetY],
        stroke: '#000',
        fill: '#000',
        strokeWidth: 1,
        pointerWidth: 6,
        source,
        target,
        id,
      });

      layer.add(arrow);
    });

    this.stage.add(layer);
  }

  reDrawEdges(node) {
    let variant = '';

    const targetX = node.attrs.x + node.attrs.width / 2;
    const targetY = node.attrs.y + node.attrs.height / 2;

    const edge = this.stage.findOne(({ attrs }) => {
      if (attrs.source === node.attrs.id) {
        variant = 'source';
        return true;
      }

      if (attrs.target === node.attrs.id) {
        variant = 'target';
        return true;
      }

      return false;
    });

    if (!edge) return;

    const prevPoints = (edge as any).points() as any[];

    if (variant === 'source') {
      (edge as any).points([targetX, targetY, prevPoints[2], prevPoints[3]]);
    }

    if (variant === 'target') {
      (edge as any).points([prevPoints[0], prevPoints[1], targetX, targetY]);
    }
  }
}
