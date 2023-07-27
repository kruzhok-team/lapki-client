import { Container } from '../basic/Container';
import { stateStyle } from '../styles';
import { Event as EventType } from '@renderer/types/diagram';
import { preloadImages } from '../utils';
import { Draggable } from './Draggable';

//Иконки событий
import onEnter from '@renderer/assets/icons/onEnter.svg';
import onExit from '@renderer/assets/icons/onExit.svg';
import DiodOn from '@renderer/assets/icons/DiodOn.svg';
import DiodOff from '@renderer/assets/icons/DiodOff.svg';

/**
 * Событие состояний.
 * Редактируемый элемент состояния, выполняет отрисовку и
 * обработку событий мыши.
 */
export class Events {
  container!: Container;
  draggable!: Draggable;
  events!: EventType;

  onEnter!: HTMLImageElement;
  onExit!: HTMLImageElement;
  DiodOn!: HTMLImageElement;
  DiodOff!: HTMLImageElement;

  constructor(container: Container, draggable: Draggable, events: EventType) {
    this.container = container;
    this.draggable = draggable;
    this.events = events;
    preloadImages([onEnter, onExit, DiodOn, DiodOff]).then(([onEnter, onExit, DiodOn, DiodOff]) => {
      this.onEnter = onEnter;
      this.onExit = onExit;
      this.DiodOn = DiodOn;
      this.DiodOff = DiodOff;
      this.container.isDirty = true;
    });
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

    Object.entries(this.events).forEach(([eventName, events], i) => {
      if (!this.onEnter || !this.onExit || !this.DiodOn || !this.DiodOff) return;
      const resultY = y + titleHeight + paddingY + (i * 50) / this.container.scale;

      if (eventName === 'onEnter') {
        ctx.drawImage(
          this.onEnter,
          x + px,
          resultY,
          100 / this.container.scale,
          40 / this.container.scale
        );
      } else {
        ctx.drawImage(
          this.onExit,
          x + px,
          resultY,
          100 / this.container.scale,
          40 / this.container.scale
        );
      }
      if (events[0].method === 'turnOn') {
        ctx.drawImage(
          this.DiodOn,
          x + 8 * px,
          resultY,
          100 / this.container.scale,
          40 / this.container.scale
        );
      } else {
        ctx.drawImage(
          this.DiodOff,
          x + 8 * px,
          resultY,
          100 / this.container.scale,
          40 / this.container.scale
        );
      }
    });

    ctx.closePath();
  }

  toJSON() {
    return {
      component: this.events.component,
      method: this.events.method,
    };
  }
}
