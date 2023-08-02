import { EventData } from '@renderer/types/diagram';

import { Draggable } from './Draggable';
import { picto } from './Picto';

import { Container } from '../basic/Container';
import { stateStyle } from '../styles';

/**
 * Событие состояний.
 * Редактируемый элемент состояния, выполняет отрисовку и
 * обработку событий мыши.
 */
export class Events {
  container!: Container;
  draggable!: Draggable;
  data!: EventData[];

  constructor(container: Container, draggable: Draggable, data: EventData[]) {
    this.container = container;
    this.draggable = draggable;
    this.data = data;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawImageEvents(ctx);
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.draggable.drawBounds;

    const paddingY = 10 / this.container.scale;
    const px = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    const titleHeight = fontSize + paddingY * 2;

    ctx.beginPath();

    Object.entries(this.data).forEach(([_eventName, events], i) => {
      const resultY = y + titleHeight + paddingY + (i * 50) / this.container.scale;

      picto.drawEvent(ctx, events.trigger, x + px, resultY);

      if (events.do.length == 0) return;
      events.do.forEach((act, i) => {
        picto.drawAction(
          ctx,
          act,
          x + (20 + (picto.eventWidth + 5) * (i + 1)) / picto.scale,
          resultY
        );
      });
    });

    ctx.closePath();
  }

  toJSON() {
    return this.data;
  }
}
