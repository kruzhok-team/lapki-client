import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import { Layer } from '@renderer/lib/types';
import { drawCircle } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';
import { FinalState as FinalStateData } from '@renderer/types/diagram';

import { PseudoStateName } from './PseudoStateName';
/**
 * Класс для отрисовки конечного состояния
 */
export class FinalState extends Shape {
  data: FinalStateData;
  smId: string;
  label: PseudoStateName;
  defaultName = 'Конечное состояния';
  constructor(app: CanvasEditor, id: string, smId: string, data: FinalStateData, parent?: Shape) {
    super(app, id, parent);
    this.data = data;
    this.smId = smId;
    this.label = new PseudoStateName(app, id, this, this.data.name ?? this.defaultName);
    this.app.view.children.add(this.label, Layer.ChoiceStates);
  }

  get tooltipText() {
    return 'Конечное состояние';
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }

  get dimensions() {
    return { width: 50, height: 50 };
  }
  set dimensions(_value) {
    throw new Error('FinalState does not have dimensions');
  }

  updateLabel(value: string) {
    const name = value === '' ? this.defaultName : value;
    this.label.text = name;
    this.data.name = name;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;
    const radius = width / 2;
    const position = { x: x + radius, y: y + radius };

    drawCircle(ctx, {
      position,
      radius: radius - 10 / this.app.controller.scale,
      fillStyle: getColor('primary'),
    });
    drawCircle(ctx, {
      position,
      radius,
      lineWidth: 3 / this.app.controller.scale,
      strokeStyle: getColor('primary'),
    });
  }
}
