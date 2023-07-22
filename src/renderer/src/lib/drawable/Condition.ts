import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import { Condition as ConditionType } from '@renderer/types/diagram';
import { Draggable } from './Draggable';

/**
 * Условие перехода (т.е. подпись ребра машины состояний).
 * Перемещаемый элемент схемы, выполняет отрисовку и 
 * обработку событий мыши.
 */
export class Condition extends Draggable {
  data!: ConditionType;

  width = 150;
  height = 75;
  isSelected = false;

  constructor(container: Container, data: ConditionType) {
    super(container, {
      x: data.position.x,
      y: data.position.y,
      width: 150,
      height: 70,
    });

    this.data = data;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { x, y, width, height } = this.drawBounds;
    const p = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    ctx.beginPath();
    ctx.fillText(this.data.component, x + p, y + p);
    ctx.fillText(this.data.method, x + p, y + fontSize + p);
    ctx.closePath();

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = transitionStyle.bgColor;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height + childrenHeight, transitionStyle.startSize);
    ctx.stroke();

    ctx.closePath();
  }

  toJSON() {
    return {
      position: {
        x: this.bounds.x,
        y: this.bounds.y,
      },
      component: this.data.component,
      method: this.data.method,
    };
  }
  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
