import { Container } from '../basic/Container';
import { stateStyle } from '../styles';
import { EventData } from '@renderer/types/diagram';
import { Draggable } from './Draggable';
import { picto } from './Picto';


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
      
      if (events.trigger.method === 'onEnter') {
        picto.drawOnEnter(ctx, x + px, resultY);
      } 
      if (events.trigger.method === 'onExit') {
        picto.drawOnExit(ctx, x + px, resultY);
      }
      
      if (events.do.length == 0) return;

      if (events.do[0].method === 'turnOn') {
        picto.drawDiodOn(ctx, x + 8 * px, resultY);
      } else {
        picto.drawDiodOff(ctx, x + 8 * px, resultY);
      }
    });

    ctx.closePath();
  }

  toJSON() {
    return this.data;
  }
}
