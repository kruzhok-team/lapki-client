import { EventData } from '@renderer/types/diagram';
import { Rectangle } from '@renderer/types/graphics';

import { Container } from '../basic/Container';
import { State } from './State';
import { picto } from './Picto';

/**
 * Событие состояний.
 * Редактируемый элемент состояния, выполняет отрисовку и
 * обработку событий мыши.
 */
export class Events {
  container!: Container;
  parent!: State;
  data!: EventData[];
  bounds!: Rectangle;

  buttonMap!: Map<Rectangle, [number, number]>;

  minEventRow = 2;
  maxEventRow = 3;

  minWidth = 15 + (picto.eventWidth + 5) * (this.minEventRow + 1);
  minHeight = picto.eventHeight;

  eventRowLength = this.minEventRow;

  constructor(container: Container, parent: State, data: EventData[]) {
    this.container = container;
    this.parent = parent;
    this.data = data;
    this.bounds = {
      x: 15,
      y: 10,
      width: this.minWidth,
      height: this.minHeight,
    };

    this.buttonMap = new Map();
    this.recalculate();
  }

  recalculate() {
    const width = this.parent.computedWidth;

    this.maxEventRow = Math.max(3, Math.floor((width - 30) / (picto.eventWidth + 5)) - 1);
    let eventRows = 0;
    let eventRowLength = this.minEventRow;
    this.data.map((ev) => {
      if (ev.do.length > eventRowLength) {
        eventRowLength = Math.min(ev.do.length, this.maxEventRow);
      }
      eventRows += Math.max(1, Math.ceil(ev.do.length / this.maxEventRow));
      // TODO: пересчитывать карту кнопок
      // this.buttonMap.set(..., [i, -1]);
    });
    this.eventRowLength = eventRowLength;
    /*
    console.log([
      'Events.recalc',
      this.parent.id,
      'maxEventRow',
      this.maxEventRow,
      'eventRowLength',
      eventRowLength,
      'eventRows',
      eventRows,
    ]);
    */
    this.bounds.width = 15 + (picto.eventWidth + 5) * (eventRowLength + 1);
    this.bounds.height = Math.max(this.minHeight, 50 * eventRows);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawImageEvents(ctx);
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.parent.drawBounds;

    const paddingY = this.bounds.y / this.container.scale;
    const px = this.bounds.x / this.container.scale;
    const titleHeight = this.parent.titleHeight;

    ctx.beginPath();

    let eventRow = 0;
    const baseY = y + titleHeight + paddingY;

    this.data.map((events, _eventIdx) => {
      picto.drawEvent(ctx, events.trigger, x + px, baseY + (eventRow * 50) / this.container.scale);

      events.do.forEach((act, actIdx) => {
        const ax = 1 + (actIdx % this.eventRowLength);
        const ay = eventRow + Math.floor(actIdx / this.eventRowLength);
        picto.drawAction(
          ctx,
          act,
          x + (20 + (picto.eventWidth + 5) * ax) / picto.scale,
          baseY + (ay * 50) / this.container.scale
        );
      });

      eventRow += Math.max(1, Math.ceil(events.do.length / this.eventRowLength));
    });

    ctx.closePath();
  }

  toJSON() {
    return this.data;
  }
}
