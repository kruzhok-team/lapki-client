import { State as StateType } from '@renderer/types/diagram';
import InitialIcon from '@renderer/assets/icons/initial state.svg';
import { Container } from '../basic/Container';
import { stateStyle } from '../styles';
import { Draggable } from './Draggable';
import { EdgeHandlers } from './EdgeHandlers';
import { preloadImages } from '../utils';

//Иконки событий
import onEnter from '@renderer/assets/icons/onEnter.svg';
import onExit from '@renderer/assets/icons/onExit.svg';
import DiodOn from '@renderer/assets/icons/DiodOn.svg';
import DiodOff from '@renderer/assets/icons/DiodOff.svg';

interface StateProps {
  container: Container;
  id: string;
  data: StateType;
  parent?: State;
  initial?: boolean;
}

export class State extends Draggable {
  id!: string;
  data!: StateType;
  isSelected = false;

  edgeHandlers!: EdgeHandlers;

  initialIcon?: HTMLImageElement;
  onEnter?: HTMLImageElement;
  onExit?: HTMLImageElement;
  DiodOn?: HTMLImageElement;
  DiodOff?: HTMLImageElement;

  toJSON() {
    return {
      parent: this.data.parent,
      events: this.data.events,
      bounds: { x: this.bounds.x, y: this.bounds.y },
    };
  }
  constructor({ container, id, data, parent, initial = false }: StateProps) {
    super(container, { ...data.bounds, width: 250, height: 100 }, parent);
    this.id = id;
    this.data = data;
    if (initial) {
      preloadImages([InitialIcon]).then(([icon]) => {
        this.initialIcon = icon;
        this.container.app.isDirty = true;
      });
    }
    preloadImages([onEnter, onExit, DiodOn, DiodOff]).then(([onEnter, onExit, DiodOn, DiodOff]) => {
      this.onEnter = onEnter;
      this.onExit = onExit;
      this.DiodOn = DiodOn;
      this.DiodOff = DiodOff;
    });
    this.edgeHandlers = new EdgeHandlers(container.app, this);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawBody(ctx);
    this.drawTitle(ctx);
    this.drawImageEvents(ctx);
    //this.drawTextEvents(ctx);

    if (this.initialIcon) {
      this.drawInitialMark(ctx);
    }

    if (this.children) {
      this.drawChildren(ctx, canvas);
    }

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
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

  /*private drawTextEvents(ctx: CanvasRenderingContext2D) {
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
  }*/

  private drawImageEvents(ctx: CanvasRenderingContext2D) {
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
      if (!this.onEnter || !this.onExit || !this.DiodOn || !this.DiodOff) return;
      const resultY = y + titleHeight + paddingY + (i * 40) / this.container.scale;
      //const eventNameWidth = ctx.measureText(eventName).width;
      //const componentWidth = ctx.measureText(events[0].component).width;
      //const gap = 5 / this.container.scale;

      //ctx.fillText(eventName, x + px, resultY);
      if (eventName === 'onEnter') {
        ctx.drawImage(
          this.onEnter,
          x + px,
          resultY,
          90 / this.container.scale,
          40 / this.container.scale
        );
      } else {
        ctx.drawImage(
          this.onExit,
          x + px,
          resultY,
          90 / this.container.scale,
          40 / this.container.scale
        );
      }

      if (events.method === 'turnOn') {
        ctx.drawImage(
          this.DiodOn,
          x + 8 * px,
          resultY,
          90 / this.container.scale,
          40 / this.container.scale
        );
      } else {
        ctx.drawImage(
          this.DiodOff,
          x + 8 * px,
          resultY,
          90 / this.container.scale,
          40 / this.container.scale
        );
      }
    });

    ctx.closePath();
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = stateStyle.selectedBorderWidth;
    ctx.strokeStyle = stateStyle.selectedBorderColor;

    NewModalWindow(this);

    ctx.beginPath();

    ctx.roundRect(x, y, width, height + childrenHeight, stateStyle.bodyBorderRadius);
    ctx.stroke();

    ctx.closePath();
  }

  private drawChildren(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (this.children.size === 0) return;

    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = 2;
    ctx.strokeStyle = stateStyle.bodyBg;

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

  private drawInitialMark(ctx: CanvasRenderingContext2D) {
    if (!this.initialIcon) return;

    const { x, y } = this.drawBounds;

    ctx.beginPath();

    ctx.drawImage(
      this.initialIcon,
      x - 30 / this.container.scale,
      y,
      25 / this.container.scale,
      25 / this.container.scale
    );

    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
function NewModalWindow(data) {
  console.log(JSON.stringify(data));
}
