import { Container } from '@renderer/lib//basic/Container';
import { isPointInRectangle } from '@renderer/lib//utils';
import { State } from '@renderer/lib/drawable/Node/State';
import { picto } from '@renderer/lib/drawable/Picto';
import { Point, Rectangle } from '@renderer/lib/types/graphics';

export type EventSelection = {
  eventIdx: number;
  actionIdx: number | null;
};

/**
 * Событие состояний.
 * Редактируемый элемент состояния, выполняет отрисовку и
 * обработку событий мыши.
 */
export class Events {
  container!: Container;
  parent!: State;
  bounds!: Rectangle;

  selection?: EventSelection;

  buttonMap!: Map<Rectangle, [number, number]>;

  minEventRow = 3;

  minWidth = 15 + (picto.eventWidth + 5) * (this.minEventRow + 1);
  minHeight = picto.eventHeight;

  constructor(container: Container, parent: State) {
    this.container = container;
    this.parent = parent;
    this.bounds = {
      x: 15,
      y: 10,
      width: this.minWidth,
      height: this.minHeight,
    };

    this.buttonMap = new Map();
    this.recalculate();
  }

  get data() {
    return this.parent.data.events;
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

  calculatePictoIndex(p: Point): EventSelection | undefined {
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.container.app.manager.data.scale;

    const eventRowLength = Math.max(3, Math.floor((width - 30) / (picto.eventWidth + 5)) - 1);

    const px = this.bounds.x / this.container.app.manager.data.scale;
    const py = this.bounds.y / this.container.app.manager.data.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = picto.eventHeight + 10;

    const pW = picto.eventWidth / picto.scale;
    const pH = picto.eventHeight / picto.scale;

    let eventRow = 0;

    for (let eventIdx = 0; eventIdx < this.data.length; eventIdx++) {
      // TODO: нажатие в пустое поле в этой области воспринимать
      //       как {eventIdx, actionIdx: -1},
      //       тогда на двойной клик будет добавить действие.
      const event = this.data[eventIdx];
      const triggerRect = {
        x: baseX,
        y: baseY + (eventRow * yDx) / this.container.app.manager.data.scale,
        width: pW,
        height: pH,
      };
      if (isPointInRectangle(triggerRect, p)) {
        return { eventIdx, actionIdx: null };
      }
      for (let actionIdx = 0; actionIdx < event.do.length; actionIdx++) {
        // const element = events[eventIdx];
        const ax = 1 + (actionIdx % eventRowLength);
        const ay = eventRow + Math.floor(actionIdx / eventRowLength);
        const actRect = {
          x: baseX + (5 + (picto.eventWidth + 5) * ax) / picto.scale,
          y: baseY + (ay * yDx) / this.container.app.manager.data.scale,
          width: pW,
          height: pH,
        };
        if (isPointInRectangle(actRect, p)) {
          return { eventIdx, actionIdx };
        }
      }
      eventRow += Math.max(1, Math.ceil(event.do.length / eventRowLength));
    }

    return undefined;
  }

  handleClick(p: Point) {
    const idx = this.calculatePictoIndex(p);
    if (!idx) {
      this.selection = undefined;
      return undefined;
    }
    this.selection = idx;
    return idx;
  }

  handleDoubleClick(p: Point) {
    const idx = this.calculatePictoIndex(p);
    return idx;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawImageEvents(ctx);
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.container.app.manager.data.scale;

    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.container.app.manager.data.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    const px = this.bounds.x / this.container.app.manager.data.scale;
    const py = this.bounds.y / this.container.app.manager.data.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = picto.eventHeight + 10;

    const platform = this.container.machineController.platform;

    let eventRow = 0;
    ctx.beginPath();

    this.data.map((events, eventIdx) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / this.container.app.manager.data.scale;
      if (typeof this.selection !== 'undefined') {
        if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == null) {
          picto.drawCursor(ctx, eX, eY);
        }
      }
      platform.drawEvent(ctx, events.trigger, eX, eY);

      events.do.forEach((act, actIdx) => {
        const ax = 1 + (actIdx % eventRowLength);
        const ay = eventRow + Math.floor(actIdx / eventRowLength);
        const aX = baseX + (5 + (picto.eventWidth + 5) * ax) / picto.scale;
        const aY = baseY + (ay * yDx) / this.container.app.manager.data.scale;
        if (typeof this.selection !== 'undefined') {
          if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == actIdx) {
            picto.drawCursor(ctx, aX, aY);
          }
        }
        platform.drawAction(ctx, act, aX, aY);
      });

      eventRow += Math.max(1, Math.ceil(events.do.length / eventRowLength));
    });

    ctx.closePath();
  }
}
