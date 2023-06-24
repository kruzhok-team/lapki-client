import { State as StateType } from '@renderer/types/diagram';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';
import { Draggable } from './Draggable';

export class State extends Draggable {
  id!: string;
  data!: StateType;

  constructor(container: Container, id: string, data: StateType) {
    super(container, data.bounds);

    this.id = id;
    this.data = data;
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

    ctx.fillStyle = stateStyle.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, stateStyle.bodyBorderRadius);
    ctx.fill();

    ctx.closePath();
  }

  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.bounds;

    ctx.font = stateStyle.titleFont;
    ctx.textBaseline = stateStyle.titleBaseLine;

    ctx.beginPath();

    ctx.fillStyle = stateStyle.titleBg;

    ctx.roundRect(x, y, width, 40, [
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
      0,
      0,
    ]);
    ctx.fill();

    ctx.fillStyle = stateStyle.titleColor;
    ctx.fillText(this.id, x + 15, y + 25);

    ctx.closePath();
  }

  private drawEvents(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.bounds;

    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

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

    ctx.lineWidth = stateStyle.selectedBorderWidth;
    ctx.strokeStyle = stateStyle.selectedBorderColor;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, stateStyle.bodyBorderRadius);
    ctx.stroke();

    ctx.closePath();
  }
}
