import { State as StateType } from '@renderer/types/diagram';
import { Container } from '../basic/Container';

export class State {
  container!: Container;

  id!: string;
  data!: StateType;

  constructor(container: Container, id: string, data: StateType) {
    this.container = container;

    this.id = id;
    this.data = data;
  }

  get bounds() {
    return {
      x: this.data.bounds.x + this.container.offset.x,
      y: this.data.bounds.y + this.container.offset.y,
      width: this.data.bounds.width,
      height: this.data.bounds.height,
    };
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    options?: { isSelected: boolean }
  ) {
    this.drawBody(ctx);
    this.drawTitle(ctx);
    this.drawEvents(ctx);

    if (options?.isSelected) this.drawSelection(ctx);
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.bounds;

    ctx.beginPath();

    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();

    ctx.closePath();
  }

  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.bounds;

    ctx.textBaseline = 'alphabetic';
    ctx.font = '20px/0 Arial';

    ctx.beginPath();

    ctx.fillStyle = 'rgb(82, 82, 82)';
    ctx.roundRect(x, y, width, 40, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.fillText(this.id, x + 15, y + 25);

    ctx.closePath();
  }

  private drawEvents(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.bounds;

    ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'hanging';

    ctx.beginPath();

    Object.entries(this.data.events).forEach(([eventName, events], i) => {
      const resultY = y + 40 + 10 + i * 40;

      ctx.fillText(eventName, x + 15, resultY);

      ctx.fillText(events[0].component, x + 90, resultY);
      ctx.fillText(events[0].method, x + 130, resultY);
    });

    ctx.closePath();
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.bounds;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, 6);
    ctx.stroke();

    ctx.closePath();
  }

  move(x: number, y: number) {
    this.data.bounds.x = x;
    this.data.bounds.y = y;
  }
}
