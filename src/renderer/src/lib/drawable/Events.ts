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

  minEventRow = 3;

  minWidth = 15 + (picto.eventWidth + 5) * (this.minEventRow + 1);
  minHeight = picto.eventHeight;

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
    let eventRows = 0;
    // TODO: здесь рассчитываем eventRowLength и считаем ряды по нему
    // но в таком случае контейнер может начать «скакать»
    this.data.map((ev) => {
      eventRows += Math.max(1, Math.ceil(ev.do.length / this.minEventRow));
      // TODO: пересчитывать карту кнопок
      // this.buttonMap.set(..., [i, -1]);
    });
    this.bounds.height = Math.max(this.minHeight, 50 * eventRows);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawImageEvents(ctx);
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.parent.drawBounds;

    const eventRowLength = Math.max(3, Math.floor((width - 30) / (picto.eventWidth + 5)) - 1);

    const paddingY = this.bounds.y / this.container.scale;
    const px = this.bounds.x / this.container.scale;
    const titleHeight = this.parent.titleHeight;

    ctx.beginPath();

    let eventRow = 0;
    const baseY = y + titleHeight + paddingY;

    const platform = this.container.machine.platform;

    this.data.map((events, _eventIdx) => {
      platform.drawEvent(
        ctx,
        events.trigger,
        x + px,
        baseY + (eventRow * 50) / this.container.scale
      );

      events.do.forEach((act, actIdx) => {
        const ax = 1 + (actIdx % eventRowLength);
        const ay = eventRow + Math.floor(actIdx / eventRowLength);
        platform.drawAction(
          ctx,
          act,
          x + (20 + (picto.eventWidth + 5) * ax) / picto.scale,
          baseY + (ay * 50) / this.container.scale
        );
      });

      eventRow += Math.max(1, Math.ceil(events.do.length / eventRowLength));
    });

    ctx.closePath();
  }

  toJSON() {
    return this.data;
  }
}
