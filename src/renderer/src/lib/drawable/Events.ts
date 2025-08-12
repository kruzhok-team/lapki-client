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
    this.calculatePictosPosition();
    console.log(this.currentEventRows);
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
      const textData = prepareText(text, this.parent.dimensions.width - 2 * 15, {
        fontFamily: 'Fira Sans',
        fontSize: 16,
        lineHeight: 1.2,
      });

      this.dimensions.height = textData.height + 10 * 2;
      this.textArray = textData.textArray;

      return;
    }
    this.dimensions.height =
      this.picto.eventHeight * this.currentEventRows + (this.currentEventRows - 1) * 10 + 10 * 2;
  }

  calculatePictoIndex(p: Point): EventSelection | undefined {
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;

    const eventRowLength = Math.max(3, Math.floor((width - 30) / (this.picto.eventWidth + 5)) - 1);

    const px = 15 / this.app.controller.scale;
    const py = 10 / this.app.controller.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = this.picto.eventHeight + 10;

    const pW = this.picto.eventWidth / this.picto.scale;
    const pH = this.picto.eventHeight / this.picto.scale;

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
          x: baseX + (5 + (this.picto.eventWidth + 5) * ax) / this.picto.scale,
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

  calculatePictosPosition() {
    const platform = this.app.controller.platform[this.parent.smId];
    if (!platform) return;
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;
    const px = 15 / this.app.controller.scale;
    const py = 10 / this.app.controller.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = this.picto.eventHeight + 10;
    this.pictos = [];
    let eventRow = 0;
    let rowWidth = 0;
    for (const event of this.data) {
      if (typeof event.do === 'string') continue;
      for (const action of event.do) {
        const actionPictoWidth = platform.calculateActionSize(action).width;
        if (
          baseX + (this.picto.eventWidth + 5) / this.picto.scale + actionPictoWidth >
          x + width - 5 / this.picto.scale
        ) {
          rowWidth = Math.max(actionPictoWidth, rowWidth);
        }
      }
      if (rowWidth > 0) {
        // TODO: ресайз состояния
      }
    }
    this.data.map((events) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / this.app.controller.scale;
      if (this.pictos[eventRow] === undefined) {
        this.pictos[eventRow] = [];
      }
      this.pictos[eventRow].push({
        type: 'event',
        x: eX,
        y: eY,
        width: this.picto.eventWidth / this.picto.scale,
        height: this.picto.pictoHeight / this.picto.scale,
      });

      if (events.condition && typeof events.condition !== 'string') {
        // TODO: Просчет размера условия
        this.pictos[eventRow].push({
          type: 'condition',
          x: eX + (this.picto.eventWidth + 5) / this.picto.scale,
          y: eY,
          width: this.picto.eventWidth / this.picto.scale,
          height: this.picto.pictoHeight / this.picto.scale,
        });
      }
      let currentActionY = eventRow + (events.condition ? 1 : 0);
      this.pictos[currentActionY] = [];
      if (typeof events.do !== 'string') {
        // переменная оффсет вместо 5
        let currentActionCoordX = baseX + (this.picto.eventWidth + 5) / this.picto.scale;
        events.do.forEach((act) => {
          const pictoDimensions = platform.calculateActionSize(act);
          // если вмещается в состояние
          let aY = 0;
          if (currentActionCoordX + pictoDimensions.width < x + width - 5 / this.picto.scale) {
            aY =
              baseY +
              currentActionY * yDx -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) /
                this.app.controller.scale;
            this.pictos[currentActionY].push({
              type: 'action',
              x: currentActionCoordX,
              y: aY,
              width: pictoDimensions.width,
              height: pictoDimensions.height,
            });
            currentActionCoordX +=
              pictoDimensions.width +
              5 / this.picto.scale +
              (this.picto.PARAMETERS_OFFSET_X * 2) / this.picto.scale;
          } else {
            currentActionCoordX = baseX + (this.picto.eventWidth + 5) / this.picto.scale;
            currentActionY += 1;
            this.pictos[currentActionY] = [];
            aY =
              baseY +
              currentActionY * yDx -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) /
                this.app.controller.scale;
            this.pictos[currentActionY].push({
              type: 'action',
              x: currentActionCoordX,
              y: aY,
              width: pictoDimensions.width,
              height: pictoDimensions.height,
            });
            currentActionCoordX +=
              pictoDimensions.width +
              5 / this.picto.scale +
              (this.picto.PARAMETERS_OFFSET_X * 2) / this.picto.scale;
          }
        });
      }

      eventRow += currentActionY - eventRow + 1;
    });
    this.currentEventRows = eventRow;
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform[this.parent.smId];
    if (!platform) return;
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;
    const px = 15 / this.app.controller.scale;
    const py = 10 / this.app.controller.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = this.picto.eventHeight + 10;

    let eventRow = 0;
    ctx.beginPath();
    let rowWidth = 0;
    for (const event of this.data) {
      if (typeof event.do === 'string') continue;
      for (const action of event.do) {
        const actionPictoWidth = platform.calculateActionSize(action).width;
        if (
          baseX + (this.picto.eventWidth + 5) / this.picto.scale + actionPictoWidth >
          x + width - 5 / this.picto.scale
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
      const eY = baseY + (eventRow * yDx) / this.app.controller.scale;
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
          eX + (this.picto.eventWidth + 5) / this.picto.scale,
          eY
        );
        ctx.closePath();
      }
      if (typeof events.condition === 'string') {
        platform.drawText(
          ctx,
          events.condition,
          eX + (this.picto.eventWidth + 5) / this.picto.scale,
          eY
        );
      }

      let currentActionY = eventRow + (events.condition ? 1 : 0);
      if (typeof events.do !== 'string') {
        // переменная оффсет вместо 5
        let currentActionCoordX = baseX + (this.picto.eventWidth + 5) / this.picto.scale;
        events.do.forEach((act, actIdx) => {
          const pictoDimensions = platform.calculateActionSize(act);
          // если вмещается в состояние
          if (currentActionCoordX + pictoDimensions.width < x + width - 5 / this.picto.scale) {
            const aY =
              baseY +
              (currentActionY * yDx) / this.picto.scale -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) /
                this.app.controller.scale;
            platform.drawAction(ctx, act, currentActionCoordX, aY);
            // TODO: сделать что-то с дублированием
            if (typeof this.selection !== 'undefined') {
              if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == actIdx) {
                this.picto.drawCursor(ctx, currentActionCoordX, aY);
              }
            }
            currentActionCoordX +=
              pictoDimensions.width +
              5 / this.picto.scale +
              (this.picto.PARAMETERS_OFFSET_X * 2) / this.picto.scale;
          } else {
            currentActionCoordX = baseX + (this.picto.eventWidth + 5) / this.picto.scale;
            currentActionY += 1;
            const aY =
              baseY +
              (currentActionY * yDx) / this.picto.scale -
              (events.condition ? this.picto.PARAMETERS_WINDOW_HEIGHT : 0) /
                this.app.controller.scale;
            platform.drawAction(ctx, act, currentActionCoordX, aY);
            if (typeof this.selection !== 'undefined') {
              if (this.selection.eventIdx == eventIdx && this.selection.actionIdx == actIdx) {
                this.picto.drawCursor(ctx, currentActionCoordX, aY);
              }
            }
            currentActionCoordX +=
              pictoDimensions.width +
              5 / this.picto.scale +
              (this.picto.PARAMETERS_OFFSET_X * 2) / this.picto.scale;
          }
        });
      }

      eventRow += Math.max(1, currentActionY - eventRow + 1);
    });
    this.currentEventRows = eventRow;
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
