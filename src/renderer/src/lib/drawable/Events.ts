import { State, picto } from '@renderer/lib/drawable';
import { Dimensions, Point } from '@renderer/lib/types/graphics';
import { isPointInRectangle } from '@renderer/lib/utils';
import { drawText, prepareText } from '@renderer/lib/utils/text';
import theme from '@renderer/theme';

import { CanvasEditor } from '../CanvasEditor';
import { serializeStateActions } from '../data/GraphmlBuilder';

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
  dimensions!: Dimensions;

  private textArray = [] as string[];
  // private textEvents = [] as string[];

  selection?: EventSelection;

  minEventRow = 3;

  minWidth = 15 + (picto.eventWidth + 5) * (this.minEventRow + 1);
  minHeight = picto.eventHeight;

  constructor(private app: CanvasEditor, public parent: State) {
    this.dimensions = {
      width: this.minWidth,
      height: this.minHeight,
    };

    this.update();
  }

  get data() {
    return this.parent.data.events;
  }

  update() {
    // TODO: Откуда брать components по-нормальному?
    if (!this.app.controller.visual) {
      const text = serializeStateActions(
        this.parent.data.events,
        this.app.controller.platform[this.parent.smId].data,
        this.app.controller.model.model.data.elements.stateMachines[this.parent.smId].components
      );

      //TODO(bryzZz) изменение параметров текста (общее для редактора)
      const textData = prepareText(text, this.parent.dimensions.width - 2 * 15, {
        fontFamily: 'Fira Sans',
        fontSize: 16,
        lineHeight: 1.2,
      });

      this.dimensions.height = textData.height + 10 * 2;
      this.textArray = textData.textArray;

      return;
    }

    let eventRows = 0;
    // TODO: здесь рассчитываем eventRowLength и считаем ряды по нему
    // но в таком случае контейнер может начать «скакать»
    this.data.map((ev) => {
      if (ev.condition) {
        eventRows += 1;
      }
      eventRows += Math.max(1, Math.ceil(ev.do.length / this.minEventRow));
    });
    this.dimensions.height = picto.eventHeight * eventRows + (eventRows - 1) * 10 + 10 * 2;
  }

  calculatePictoIndex(p: Point): EventSelection | undefined {
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;

    const eventRowLength = Math.max(3, Math.floor((width - 30) / (picto.eventWidth + 5)) - 1);

    const px = 15 / this.app.controller.scale;
    const py = 10 / this.app.controller.scale;
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
        y: baseY + (eventRow * yDx) / this.app.controller.scale,
        width: pW,
        height: pH,
      };
      if (isPointInRectangle(triggerRect, p)) {
        return { eventIdx, actionIdx: null };
      }

      eventRow += event.condition ? 1 : 0;

      for (let actionIdx = 0; actionIdx < event.do.length; actionIdx++) {
        // const element = events[eventIdx];
        const ax = 1 + (actionIdx % eventRowLength);
        const ay = eventRow + Math.floor(actionIdx / eventRowLength);
        const actRect = {
          x: baseX + (5 + (picto.eventWidth + 5) * ax) / picto.scale,
          y: baseY + (ay * yDx) / this.app.controller.scale,
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
    return this.calculatePictoIndex(p);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.app.controller.visual) {
      return this.drawTextEvents(ctx);
    }

    this.drawImageEvents(ctx);
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform[this.parent.smId];
    if (!platform) return;
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;

    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.controller.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    const px = 15 / this.app.controller.scale;
    const py = 10 / this.app.controller.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = picto.eventHeight + 10;

    let eventRow = 0;
    ctx.beginPath();

    this.data.map((events, eventIdx) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / this.app.controller.scale;
      if (typeof this.selection !== 'undefined') {
        if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == null) {
          picto.drawCursor(ctx, eX, eY);
        }
      }

      if (typeof events.trigger !== 'string') {
        platform.drawEvent(ctx, events.trigger, eX, eY);
      }

      if (events.condition && typeof events.condition !== 'string') {
        ctx.beginPath();
        platform.drawCondition(
          ctx,
          events.condition,
          eX + (picto.eventWidth + 5) / picto.scale,
          eY
        );
        ctx.closePath();
      }

      if (typeof events.do !== 'string') {
        events.do.forEach((act, actIdx) => {
          const ax = 1 + (actIdx % eventRowLength);
          const ay = eventRow + Math.floor(actIdx / eventRowLength) + (events.condition ? 1 : 0);
          const aX = baseX + ((picto.eventWidth + 5) * ax) / picto.scale;
          const aY = baseY + (ay * yDx) / this.app.controller.scale;
          if (typeof this.selection !== 'undefined') {
            if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == actIdx) {
              picto.drawCursor(ctx, aX, aY);
            }
          }
          platform.drawAction(ctx, act, aX, aY);
        });
      }

      eventRow +=
        Math.max(1, Math.ceil(events.do.length / eventRowLength)) + (events.condition ? 1 : 0);
    });

    ctx.closePath();
  }

  private drawTextEvents(ctx: CanvasRenderingContext2D) {
    const scale = this.app.controller.scale;
    const { x, y } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / scale;
    const px = 15 / scale;
    const py = 10 / scale;
    const fontSize = 16 / scale;

    drawText(ctx, this.textArray, {
      x: x + px,
      y: y + titleHeight + py,
      textAlign: 'left',
      color: theme.colors.diagram.state.titleColor,
      font: {
        fontSize,
        fontFamily: 'Fira Sans',
        lineHeight: 1.2,
      },
    });
  }
}
