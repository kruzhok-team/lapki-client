import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EdgeHandlers } from '@renderer/lib/drawable';
import { Shape } from '@renderer/lib/drawable/Shape';
import { Layer } from '@renderer/lib/types';
import { getColor } from '@renderer/theme';
import { ChoiceState as DataChoiceState } from '@renderer/types/diagram';

import { PseudoStateName } from './PseudoStateName';

/**
 * Представление псевдосостояния выбора
 */
export class ChoiceState extends Shape {
  isSelected = false;
  edgeHandlers!: EdgeHandlers;
  data: DataChoiceState;
  smId: string;
  label: PseudoStateName;
  defaultName = 'Псевдосостояние выбора';
  constructor(app: CanvasEditor, id: string, smId: string, data: DataChoiceState, parent?: Shape) {
    super(app, id, parent);
    this.data = data;
    this.smId = smId;
    this.edgeHandlers = new EdgeHandlers(this.app as CanvasEditor, this);
    data.name = !data.name ? this.defaultName : data.name;
    this.label = new PseudoStateName(app, id, this, data.name);
    this.app.view.children.add(this.label, Layer.ChoiceStates);
  }

  get tooltipText() {
    return 'Псевдосостояние выбора';
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }

  get dimensions() {
    return { width: 100, height: 100 };
  }
  set dimensions(_value) {
    throw new Error('ChoiceState does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
    }
  }

  updateLabel(value: string) {
    // debugger;
    const name = !value ? this.defaultName : value;
    this.label.text = name;
    this.data.name = name;
  }

  // TODO(bryzZz) Закруглить углы
  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.fillStyle = getColor('primary');

    ctx.beginPath();

    ctx.moveTo(x + halfWidth, y);
    ctx.lineTo(x + width, y + halfHeight);
    ctx.lineTo(x + halfWidth, y + height);
    ctx.lineTo(x, y + halfHeight);
    ctx.lineTo(x + halfWidth, y);

    ctx.fill();

    ctx.closePath();
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.lineWidth = 2 / this.app.controller.scale;
    // TODO(L140-beep): Пользовательский цвет обводки
    ctx.strokeStyle = getColor('default-state-outline');

    ctx.beginPath();

    ctx.moveTo(x + halfWidth, y);
    ctx.lineTo(x + width, y + halfHeight);
    ctx.lineTo(x + halfWidth, y + height);
    ctx.lineTo(x, y + halfHeight);
    ctx.lineTo(x + halfWidth, y);

    ctx.stroke();

    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;

    this.edgeHandlers.disabled = value;
  }
}
