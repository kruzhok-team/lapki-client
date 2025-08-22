import { State } from '@renderer/lib/drawable';
import { Dimensions, Point } from '@renderer/lib/types/graphics';
import { isPointInRectangle } from '@renderer/lib/utils';
import { drawText, prepareText } from '@renderer/lib/utils/text';
import theme from '@renderer/theme';

import { CanvasEditor } from '../CanvasEditor';
import { serializeStateActions } from '../data/GraphmlBuilder';
import { Picto } from '../types';

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

  currentEventRows = 0;
  minEventRow = 3;
  minWidth: number;
  minHeight: number;
  pictos: Picto[][] = []; // строки/столбцы
  constructor(private app: CanvasEditor, public parent: State) {
    this.minWidth = 15 + (this.picto.eventWidth + 5) * (this.minEventRow + 1);
    this.minHeight = this.picto.eventHeight;
    this.dimensions = {
      width: this.minWidth,
      height: this.minHeight,
    };
    this.update();
  }

  get picto() {
    return this.app.controller.view.picto;
  }

  get data() {
    return this.parent.data.events;
  }

  update() {
    // TODO(L140-beep): Откуда брать components по-нормальному?
    if (!this.app.controller.visual) {
      const text = serializeStateActions(
        this.parent.data.events,
        this.app.controller.platform[this.parent.smId].data,
        this.app.controller.model.model.data.elements.stateMachines[this.parent.smId].components
      );

      //TODO(bryzZz) изменение параметров текста (общее для редактора)
      const textData = prepareText(
        text,
        this.parent.dimensions.width - 2 * this.picto.PICTO_OFFSET_X,
        {
          fontFamily: 'Fira Sans',
          fontSize: 16,
          lineHeight: 1.2,
        }
      );

      this.dimensions.height = textData.height + this.picto.PICTO_OFFSET_Y * 2;
      this.textArray = textData.textArray;

      return;
    }
    this.calculatePictosPosition(this.picto.scale);
    this.dimensions.height =
      this.picto.eventHeight * this.currentEventRows +
      (this.currentEventRows - 1) * this.picto.PICTO_OFFSET_Y +
      this.picto.PICTO_OFFSET_Y * 2;
  }

  calculatePictoIndex(p: Point): EventSelection | undefined {
    let eventIdx = -1;
    this.calculatePictosPosition(this.picto.scale);
    let actIdx = -1;
    for (const row of this.pictos) {
      for (const picto of row) {
        if (picto.type === 'event') {
          eventIdx += 1;
          actIdx = -1;
          // this.picto.drawCursor(
          //   this.app.canvas.context,
          //   picto.x,
          //   picto.y,
          //   picto.width * this.picto.scale,
          //   picto.height * this.picto.scale
          // );
          if (
            isPointInRectangle(
              {
                ...picto,
                width: picto.width,
                height: picto.height,
              },
              p
            )
          ) {
            return {
              eventIdx,
              actionIdx: null,
            };
          }
          continue;
        }
        if (picto.type === 'action') {
          actIdx += 1;
          // this.picto.drawCursor(
          //   this.app.canvas.context,
          //   picto.x,
          //   picto.y,
          //   picto.width * this.picto.scale,
          //   picto.height * this.picto.scale
          // );
          if (
            isPointInRectangle(
              {
                ...picto,
                width: picto.width,
                height: picto.height,
              },
              p
            )
          ) {
            return {
              eventIdx,
              actionIdx: actIdx,
            };
          }
        }
      }
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

  // Вычисляет позиции пиктограмм с УЧЕТОМ масштаба
  calculatePictosPosition(scale: number) {
    const platform = this.app.controller.platform[this.parent.smId];
    if (!platform) return;
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / scale;
    const px = this.picto.PICTO_OFFSET_X / scale;
    const py = this.picto.PICTO_OFFSET_Y / scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = this.picto.eventHeight + this.picto.PICTO_OFFSET_Y;
    this.pictos = [];
    let eventRow = 0;
    let rowWidth = 0;
    for (const event of this.data) {
      if (typeof event.do === 'string') continue;
      for (const action of event.do) {
        const actionPictoWidth = platform.calculateActionSize(action).width;
        if (
          baseX +
            (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / this.picto.scale +
            actionPictoWidth >
          x + width - this.picto.PARAMETERS_OFFSET_X / this.picto.scale
        ) {
          rowWidth = Math.max(actionPictoWidth, rowWidth);
        }
      }
      if (rowWidth > 0) {
        this.parent.data.dimensions.width =
          rowWidth * this.picto.scale +
          this.picto.PARAMETERS_OFFSET_X +
          this.picto.PICTO_OFFSET_X * 2 +
          this.picto.eventWidth;
      }
    }
    this.data.map((events) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / scale;
      if (this.pictos[eventRow] === undefined) {
        this.pictos[eventRow] = [];
      }
      this.pictos[eventRow].push({
        type: 'event',
        x: eX,
        y: eY,
        width: this.picto.eventWidth / scale,
        height: this.picto.pictoHeight / scale,
      });

      if (events.condition && typeof events.condition !== 'string') {
        // TODO: Просчет размера условия
        this.pictos[eventRow].push({
          type: 'condition',
          x: eX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / scale,
          y: eY,
          width: this.picto.eventWidth / scale,
          height: this.picto.pictoHeight / scale,
        });
      }
      let currentActionY = eventRow + (events.condition ? 1 : 0);
      this.pictos[currentActionY] = this.pictos[currentActionY] || [];
      if (typeof events.do !== 'string') {
        // переменная оффсет вместо 5
        let currentActionCoordX =
          baseX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / scale;
        events.do.forEach((act) => {
          const pictoDimensions = platform.calculateActionSize(act);
          // если вмещается в состояние
          let aY = 0;
          if (
            currentActionCoordX + pictoDimensions.width <
            x + width - this.picto.PARAMETERS_OFFSET_X / scale
          ) {
            aY =
              baseY +
              (currentActionY * yDx) / scale -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) / scale;
            this.pictos[currentActionY].push({
              type: 'action',
              x: currentActionCoordX,
              y: aY,
              width: pictoDimensions.width,
              height: this.picto.eventHeight / scale,
            });
            currentActionCoordX += pictoDimensions.width + this.picto.PARAMETERS_OFFSET_X / scale;
          } else {
            currentActionCoordX =
              baseX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / scale;
            currentActionY += 1;
            this.pictos[currentActionY] = [];
            aY =
              baseY +
              (currentActionY * yDx) / scale -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) / scale;
            this.pictos[currentActionY].push({
              type: 'action',
              x: currentActionCoordX,
              y: aY,
              width: pictoDimensions.width,
              height: this.picto.eventHeight / scale,
            });
            currentActionCoordX += pictoDimensions.width + this.picto.PARAMETERS_OFFSET_X / scale;
          }
        });
      }

      eventRow += currentActionY - eventRow + 1;
    });
    this.currentEventRows = eventRow;
  }

  // По-хорошему отсюда должны уйти все рассчеты
  // А отрисовка должны идти по тому, что уже рассчитано в
  // calculatePictosPosition
  // Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform[this.parent.smId];
    if (!platform) return;
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;
    const px = this.picto.PICTO_OFFSET_X / this.app.controller.scale;
    const py = this.picto.PICTO_OFFSET_Y / this.app.controller.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = this.picto.eventHeight + this.picto.PICTO_OFFSET_Y;

    let eventRow = 0;
    ctx.beginPath();
    let rowWidth = 0;
    for (const event of this.data) {
      if (typeof event.do === 'string') continue;
      for (const action of event.do) {
        const actionPictoWidth = platform.calculateActionSize(action).width;
        if (
          baseX +
            (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / this.picto.scale +
            actionPictoWidth >
          x + width - this.picto.PARAMETERS_OFFSET_X / this.picto.scale
        ) {
          rowWidth = Math.max(actionPictoWidth, rowWidth);
        }
      }
      if (rowWidth > 0) {
        // ресайз состояния
      }
    }
    this.data.map((events, eventIdx) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / this.picto.scale;
      if (typeof this.selection !== 'undefined') {
        if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == null) {
          this.picto.drawCursor(ctx, eX, eY);
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
          eX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / this.picto.scale,
          eY
        );
        ctx.closePath();
      }
      if (typeof events.condition === 'string') {
        platform.drawText(
          ctx,
          events.condition,
          eX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / this.picto.scale,
          eY
        );
      }

      let currentActionY = eventRow + (events.condition ? 1 : 0);
      const drawCursorIfSelected: (
        event: EventSelection,
        ...args: Parameters<typeof this.picto.drawCursor>
      ) => ReturnType<typeof this.picto.drawCursor> = (event, ctx, x, y, scaledWidth, height) => {
        if (this.selection !== undefined) {
          if (
            this.selection.eventIdx == event.eventIdx &&
            this.selection.actionIdx == event.actionIdx
          ) {
            this.picto.drawCursor(
              ctx,
              x,
              y,
              scaledWidth ? scaledWidth * this.picto.scale : undefined,
              height
            );
          }
        }
      };
      if (typeof events.do !== 'string') {
        let currentActionCoordX =
          baseX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / this.picto.scale;
        events.do.forEach((act, actIdx) => {
          const pictoDimensions = platform.calculateActionSize(act);
          if (
            currentActionCoordX + pictoDimensions.width <
            x + width - this.picto.PARAMETERS_OFFSET_X / this.picto.scale
          ) {
            const aY =
              baseY +
              (currentActionY * yDx) / this.picto.scale -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) /
                this.app.controller.scale;
            platform.drawAction(ctx, act, currentActionCoordX, aY);
            drawCursorIfSelected(
              { eventIdx, actionIdx: actIdx },
              ctx,
              currentActionCoordX,
              aY,
              pictoDimensions.width,
              this.picto.eventHeight
            );
            currentActionCoordX +=
              pictoDimensions.width + this.picto.PARAMETERS_OFFSET_X / this.picto.scale;
          } else {
            currentActionCoordX =
              baseX + (this.picto.eventWidth + this.picto.PARAMETERS_OFFSET_X) / this.picto.scale;
            currentActionY += 1;
            const aY =
              baseY +
              (currentActionY * yDx) / this.picto.scale -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) /
                this.app.controller.scale;
            platform.drawAction(ctx, act, currentActionCoordX, aY);
            drawCursorIfSelected(
              { eventIdx, actionIdx: actIdx },
              ctx,
              currentActionCoordX,
              aY,
              pictoDimensions.width,
              this.picto.eventHeight
            );
            currentActionCoordX +=
              pictoDimensions.width + this.picto.PARAMETERS_OFFSET_X / this.picto.scale;
          }
        });
      }

      eventRow += Math.max(1, currentActionY - eventRow + 1);
    });
    this.currentEventRows = eventRow;
    // this.calculatePictoIndex({ x: -1000, y: -1000 });
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
