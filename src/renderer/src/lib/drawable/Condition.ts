import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import { Condition as ConditionType } from '@renderer/types/diagram';
import { Draggable } from './Draggable';

export class Condition extends Draggable {
  data!: ConditionType;

  width = 150;
  height = 75;

  constructor(container: Container, data: ConditionType) {
    super(container, {
      x: data.position.x,
      y: data.position.y,
      width: 150,
      height: 70,
    });

    this.data = data;
  }

  draw(ctx: CanvasRenderingContext2D) {
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
  }

  toJSON() {
    return {
      x: this.drawBounds.x,
      y: this.drawBounds.y,
    };
  }
}
