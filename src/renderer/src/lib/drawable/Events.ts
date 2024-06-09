import { State, picto } from '@renderer/lib/drawable';
import { Dimensions, Point } from '@renderer/lib/types/graphics';

// import { serializeEvents } from '../data/GraphmlBuilder';

import { isPointInRectangle } from '@renderer/lib/utils';
import { drawText, getTextHeight, getTextWidth, prepareText } from '@renderer/lib/utils/text';
import theme, { getColor } from '@renderer/theme';

import { CanvasEditor } from '../CanvasEditor';

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

  // private textArray = [] as string[];
  private textEvents = [] as string[];

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
    if (this.app.textMode) {
      // const { width } = this.parent.drawBounds;
      // const pX = 15 / this.container.app.manager.data.scale;
      // const pY = 10 / this.container.app.manager.data.scale;

      // const text = serializeEvents(this.parent.data.events);

      // const { textArray, height } = prepareText({
      //   text,
      //   fontSize: 16,
      //   fontFamily: 'monospace',
      //   lineHeight: 1.4,
      //   maxWidth: width - 2 * pX,
      // });

      // this.textArray = textArray;
      // this.sizes.height = height + pY * 2;

      const textEvents: any[] = [];
      const textHeight = getTextHeight({ fontSize: 16, lineHeight: 1.2 });
      const py = 6;
      const height = textHeight + py * 2;

      for (let i = 0; i < this.parent.data.events.length; i++) {
        const event = this.parent.data.events[i];

        textEvents.push({
          trigger: {
            component: { x: 0, y: 0 },
            method: { x: 0, y: 0 },
            height,
          },
        });
      }

      return;
    }

    let eventRows = 0;
    // TODO: здесь рассчитываем eventRowLength и считаем ряды по нему
    // но в таком случае контейнер может начать «скакать»
    this.data.map((ev) => {
      eventRows += Math.max(1, Math.ceil(ev.do.length / this.minEventRow));
    });
    this.dimensions.height = Math.max(this.minHeight, 50 * eventRows);
  }

  calculatePictoIndex(p: Point): EventSelection | undefined {
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.model.data.scale;

    const eventRowLength = Math.max(3, Math.floor((width - 30) / (picto.eventWidth + 5)) - 1);

    const px = 15 / this.app.model.data.scale;
    const py = 10 / this.app.model.data.scale;
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
        y: baseY + (eventRow * yDx) / this.app.model.data.scale,
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
          y: baseY + (ay * yDx) / this.app.model.data.scale,
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
    if (this.app.textMode) {
      return this.drawTextEvents(ctx);
    }

    this.drawImageEvents(ctx);
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform;
    if (!platform) return;

    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.model.data.scale;

    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.model.data.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    const px = 15 / this.app.model.data.scale;
    const py = 10 / this.app.model.data.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = picto.eventHeight + 10;

    let eventRow = 0;
    ctx.beginPath();

    this.data.map((events, eventIdx) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / this.app.model.data.scale;
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
        const aY = baseY + (ay * yDx) / this.app.model.data.scale;
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

  private drawTriggers(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const scale = this.app.model.data.scale;

    const fontSize = 16 / scale;
    const textHeight = getTextHeight({ fontSize });
    const dotTextWidth = getTextWidth(ctx, '.', `normal ${fontSize}px/1.2 'Fira Sans'`);

    const boxPaddingY = 6 / scale;
    const gapX = 6 / scale;
    const gapY = 10 / scale;
    const textPaddingBottom = 2 / scale;
    const boxHeight = boxPaddingY * 2 + textHeight;
    const boxWidth = 100 / scale;

    const baseFontOptions = {
      color: getColor('text-primary'),
      fontSize,
      fontFamily: 'Fira Sans',
      textAlign: 'center',
    } as const;

    ctx.fillStyle = theme.colors.diagram.state.titleBg;

    ctx.beginPath();

    this.parent.data.events.forEach((_, i) => {
      const boxY = y + i * boxHeight + gapY * i;

      ctx.roundRect(x, boxY, boxWidth, boxHeight, 2 / scale);
      ctx.roundRect(
        x + boxWidth + boxPaddingY * 2 + dotTextWidth,
        boxY,
        boxWidth,
        boxHeight,
        2 / scale
      );
    });

    ctx.fill();

    this.parent.data.events.forEach((event, i) => {
      const boxY = y + i * boxHeight + gapY * i;

      drawText(ctx, event.trigger.component, {
        x: x + boxWidth / 2,
        y: boxY + boxPaddingY,
        ...baseFontOptions,
      });

      drawText(ctx, '.', {
        x: x + boxWidth + gapX,
        y: boxY + boxHeight - textPaddingBottom,
        ...baseFontOptions,
        textAlign: 'left',
        textBaseline: 'bottom',
      });

      drawText(ctx, event.trigger.method, {
        x: x + boxWidth + gapX * 2 + dotTextWidth + boxWidth / 2,
        y: boxY + boxPaddingY,
        ...baseFontOptions,
      });

      drawText(ctx, '/', {
        x: x + boxWidth * 2 + gapX * 3 + dotTextWidth,
        y: boxY + boxHeight - textPaddingBottom,
        ...baseFontOptions,
        textAlign: 'left',
        textBaseline: 'bottom',
      });
    });

    ctx.closePath();
  }

  private drawTextEvents(ctx: CanvasRenderingContext2D) {
    const scale = this.app.model.data.scale;
    const { x, y } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / scale;
    const px = 15 / scale;
    const py = 10 / scale;

    this.drawTriggers(ctx, x + px, y + titleHeight + py);

    // drawText(ctx, this.textArray, {
    //   x: x + px,
    //   y: y + titleHeight + py,
    //   textAlign: 'left',
    //   color: getColor('text-primary'),
    //   fontSize,
    //   fontFamily: 'monospace',
    //   lineHeight: 1.4,
    // });
  }
}
