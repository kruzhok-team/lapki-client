import { Elements, State as StateType } from '@renderer/types/diagram';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';
import { Draggable } from './Draggable';
import { EdgeHandlers } from './EdgeHandlers';

export class State extends Draggable {
  id!: string;
  data!: StateType;

  isSelected = false;

  edgeHandlers!: EdgeHandlers;

  constructor(container: Container, id: string, data: StateType, parent?: State) {
    super(container, { ...data.bounds, width: 200, height: 100 }, parent);

    this.id = id;
    this.data = data;

    this.edgeHandlers = new EdgeHandlers(container.app, this);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawBody(ctx);
    this.drawTitle(ctx);
    this.drawEvents(ctx);

    if (this.children) {
      this.drawChildren(ctx, canvas);
    }

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx, canvas);
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = stateStyle.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, [
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
      this.children.size !== 0 ? 0 : stateStyle.bodyBorderRadius,
      this.children.size !== 0 ? 0 : stateStyle.bodyBorderRadius,
    ]);
    ctx.fill();

    ctx.closePath();
  }

  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;

    const paddingY = 10 / this.container.scale;
    const paddingX = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    const titleHeight = fontSize + paddingY * 2;

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.textBaseline = stateStyle.titleBaseLine;

    ctx.beginPath();

    ctx.fillStyle = stateStyle.titleBg;

    ctx.roundRect(x, y, width, titleHeight, [
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
      0,
      0,
    ]);
    ctx.fill();

    ctx.fillStyle = stateStyle.titleColor;
    ctx.fillText(this.id, x + paddingX, y + paddingY);

    ctx.closePath();
  }

  private drawEvents(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.drawBounds;

    const paddingY = 10 / this.container.scale;
    const px = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    const titleHeight = fontSize + paddingY * 2;

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

    ctx.beginPath();

    Object.entries(this.data.events).forEach(([eventName, events], i) => {
      const resultY = y + titleHeight + paddingY + (i * 40) / this.container.scale;
      const eventNameWidth = ctx.measureText(eventName).width;
      const componentWidth = ctx.measureText(events[0].component).width;
      const gap = 5 / this.container.scale;

      ctx.fillText(eventName, x + px, resultY);

      ctx.fillText(events[0].component, x + px + eventNameWidth + gap, resultY);
      ctx.fillText(events[0].method, x + px + eventNameWidth + componentWidth + gap * 2, resultY);
    });

    ctx.closePath();
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = stateStyle.selectedBorderWidth;
    ctx.strokeStyle = stateStyle.selectedBorderColor;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height + childrenHeight, stateStyle.bodyBorderRadius);
    ctx.stroke();

    ctx.closePath();
  }

  private drawChildren(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (this.children.size === 0) return;

    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.strokeStyle = stateStyle.bodyBg;
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + height, width - 2, childrenHeight, [
      0,
      0,
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
    ]);
    ctx.stroke();

    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
