import { State } from '@renderer/lib/drawable';
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
  selection: EventSelection[] = [];

  minEventRow = 3;
  minWidth: number;
  minHeight: number;
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
      if (!ev) return;
      if (ev.condition) {
        eventRows += 1;
      }
      eventRows += Math.max(1, Math.ceil(ev.do.length / this.minEventRow));
    });
    this.dimensions.height = this.picto.eventHeight * eventRows + (eventRows - 1) * 10 + 10 * 2;
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

  handleClick(p: Point, add?: boolean): [boolean, EventSelection] | undefined {
    const idx = this.calculatePictoIndex(p);
    if (!add) {
      this.selection = [];
    }
    if (idx) {
      const selected = this.isSelected(idx.eventIdx, idx.actionIdx);
      if (selected === -1) {
        this.selection?.push(idx);
        return [true, idx];
      } else {
        this.unselectAction(idx);
        return [false, idx];
      }
    }

    return undefined;
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

  // Remove action from selection array.
  unselectAction(selection: EventSelection) {
    const idx = this.isSelected(selection.eventIdx, selection.actionIdx);
    if (idx !== -1) {
      this.selection.splice(idx, 1);
      return true;
    }

    return false;
  }

  // Find all actions and event indexes at array.
  private findEvent(eventIdx: number): number[] {
    return this.selection
      .map((selection, idx) => {
        if (selection.eventIdx === eventIdx) {
          return idx;
        }
        return -1;
      })
      .filter((idx) => idx !== -1);
  }

  // Remove event and all actions related with it
  unselectEvent(selection: EventSelection) {
    const indexes = this.findEvent(selection.eventIdx);
    if (indexes.length === 0) return false;

    this.selection = this.selection.filter((_, idx) => !indexes.includes(idx));

    return true;
  }

  //Прорисовка событий в блоках состояния
  private drawImageEvents(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform[this.parent.smId];
    if (!platform) return;
    const { x, y, width } = this.parent.drawBounds;
    const titleHeight = this.parent.titleHeight / this.app.controller.scale;

    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.controller.scale - 30) / (this.picto.eventWidth + 5)) - 1
    );

    const px = 15 / this.app.controller.scale;
    const py = 10 / this.app.controller.scale;
    const baseX = x + px;
    const baseY = y + titleHeight + py;
    const yDx = this.picto.eventHeight + 10;

    let eventRow = 0;
    ctx.beginPath();

    this.data.map((events, eventIdx) => {
      const eX = baseX;
      const eY = baseY + (eventRow * yDx) / this.app.controller.scale;
      if (this.selection.length > 0) {
        if (this.isSelected(eventIdx, null) !== -1) {
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

      if (typeof events.do !== 'string') {
        events.do.forEach((act, actIdx) => {
          const ax = 1 + (actIdx % eventRowLength);
          const ay = eventRow + Math.floor(actIdx / eventRowLength) + (events.condition ? 1 : 0);
          const aX = baseX + ((this.picto.eventWidth + 5) * ax) / this.picto.scale;
          const aY = baseY + (ay * yDx) / this.app.controller.scale;
          if (typeof this.selection !== 'undefined') {
            if (this.isSelected(eventIdx, actIdx) !== -1) {
              this.picto.drawCursor(ctx, aX, aY);
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

  isSelected(eventIdx: number, actionIdx: number | null) {
    return this.selection.findIndex(
      (selection) => selection.eventIdx === eventIdx && selection.actionIdx === actionIdx
    );
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
