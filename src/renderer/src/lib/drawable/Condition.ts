import { Container } from '../basic/Container';
import { transitionStyle } from '../styles';
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

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { x, y, width, height } = this.bounds;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();

    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    ctx.beginPath();

    ctx.fillText(this.data.component, x + 15, y + 15);
    ctx.fillText(this.data.method, x + 15, y + 30 + 15);

    ctx.closePath();
  }
}
