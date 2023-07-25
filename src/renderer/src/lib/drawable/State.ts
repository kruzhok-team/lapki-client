import { State as StateType } from '@renderer/types/diagram';
import InitialIcon from '@renderer/assets/icons/initial state.svg';
import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import { Draggable } from './Draggable';
import { EdgeHandlers } from './EdgeHandlers';
import { preloadImages } from '../utils';
import { Events } from './Events';
import { ContextMenu } from './ContextMenu';

interface StateProps {
  container: Container;
  id: string;
  data: StateType;
  parent?: State;
  initial?: boolean;
}

/**
 * Нода машины состояний.
 * Класс выполняет отрисовку, обработку событий (за счёт {@link Draggable}),
 * управление собственным выделением и отображение «хваталок».
 */
export class State extends Draggable {
  id!: string;
  data!: StateType;
  contextmenu!: ContextMenu;
  isState;
  isSelected = false;
  isSelectedMenu = false;

  statusevent!: Events;
  edgeHandlers!: EdgeHandlers;
  initialIcon?: HTMLImageElement;
  onEnter?: HTMLImageElement;
  onExit?: HTMLImageElement;
  DiodOn?: HTMLImageElement;
  DiodOff?: HTMLImageElement;

  toJSON() {
    return {
      parent: this.data.parent,
      events: this.data.events,
      bounds: { x: this.bounds.x, y: this.bounds.y },
    };
  }

  constructor({ container, id, data, parent, initial = false }: StateProps) {
    super(container, { ...data.bounds, width: 230, height: 100 }, parent);
    this.id = id;
    this.data = data;
    this.container = container;
    if (initial) {
      preloadImages([InitialIcon]).then(([icon]) => {
        this.initialIcon = icon;
        this.container.isDirty = true;
      });
    }

    this.statusevent = new Events(this.container, this, this.data.events);

    this.edgeHandlers = new EdgeHandlers(container.app, this);

    this.contextmenu = new ContextMenu(this.container, this);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawBody(ctx);
    this.drawTitle(ctx);
    this.statusevent.draw(ctx);
    //this.drawTextEvents(ctx);

    if (this.initialIcon) {
      this.drawInitialMark(ctx);
    }

    if (this.children) {
      this.drawChildren(ctx, canvas);
    }

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
    }

    if (this.isSelectedMenu) {
      this.contextmenu.draw(ctx);
    }
  }

  //Прорисовка блока состояния
  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = stateStyle.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, [
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
      this.children.size !== 0 ? 0 : stateStyle.bodyBorderRadius,
      this.children.size !== 0 ? 0 : stateStyle.bodyBorderRadius,
    ]);
    ctx.fill();

    ctx.closePath();
  }

  //Прорисовка заголовка блока состояния
  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;

    const paddingY = 10 / this.container.scale;
    const paddingX = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    const titleHeight = fontSize + paddingY * 2;

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.textBaseline = stateStyle.titleBaseLine;

    ctx.beginPath();

    ctx.fillStyle = stateStyle.titleBg;

    ctx.roundRect(x, y, width, titleHeight, [
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
      0,
      0,
    ]);
    ctx.fill();

    ctx.fillStyle = stateStyle.titleColor;
    ctx.fillText(this.id, x + paddingX, y + paddingY);

    ctx.closePath();
  }

  /*private drawTextEvents(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.drawBounds;

    const paddingY = 10 / this.container.scale;
    const px = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    const titleHeight = fontSize + paddingY * 2;

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

    ctx.beginPath();

    Object.entries(this.data.events).forEach(([eventName, events], i) => {
      const resultY = y + titleHeight + paddingY + (i * 40) / this.container.scale;
      const eventNameWidth = ctx.measureText(eventName).width;
      const componentWidth = ctx.measureText(events[0].component).width;
      const gap = 5 / this.container.scale;

      ctx.fillText(eventName, x + px, resultY);

      ctx.fillText(events[0].component, x + px + eventNameWidth + gap, resultY);
      ctx.fillText(events[0].method, x + px + eventNameWidth + componentWidth + gap * 2, resultY);
    });

    ctx.closePath();
  }*/

  //Обводка блока состояния при нажатии
  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;
    ctx.canvas.hidden;

    ctx.lineWidth = stateStyle.selectedBorderWidth;
    ctx.strokeStyle = stateStyle.selectedBorderColor;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height + childrenHeight, stateStyle.bodyBorderRadius);
    ctx.stroke();
    ctx.closePath();

    //Начало рисования
    ctx.beginPath();
    //Добавляет стиль заднему фону
    ctx.fillStyle = stateStyle.bodyBg;
    //создает указательный треугольник
    ctx.moveTo(x + 100 / this.container.scale, y - 20 / this.container.scale);
    ctx.lineTo(x + 110 / this.container.scale, y - 2 / this.container.scale);
    ctx.lineTo(x + 120 / this.container.scale, y - 20 / this.container.scale);
    //Строит прямоугольник
    ctx.roundRect(x, y - 120 / this.container.scale, width, height, transitionStyle.startSize);
    //Добавляет задний фон объекту канвы
    ctx.fill();
    //Конец рисования
    ctx.closePath();

    ctx.beginPath();
    //Добавляет стиль тексту
    ctx.fillStyle = transitionStyle.bgColor;
    ctx.fillText(this.isState, x, y - 80 / this.container.scale);
    //Добавляет задний фон объекту канвы
    ctx.fill();
    ctx.closePath();
  }

  //Дополнять внешними border при добавлении дочерних состояний
  private drawChildren(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (this.children.size === 0) return;

    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = 2;
    ctx.strokeStyle = stateStyle.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + height, width - 2, childrenHeight, [
      0,
      0,
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
    ]);
    ctx.stroke();

    ctx.closePath();
  }

  private drawInitialMark(ctx: CanvasRenderingContext2D) {
    if (!this.initialIcon) return;

    const { x, y } = this.drawBounds;

    ctx.beginPath();

    ctx.drawImage(
      this.initialIcon,
      x - 30 / this.container.scale,
      y,
      25 / this.container.scale,
      25 / this.container.scale
    );

    ctx.closePath();
  }

  setIsSelected(value: boolean, target: string) {
    this.isSelected = value;
    this.isState = target;
  }

  setIsSelectedMenu(value: boolean) {
    this.isSelectedMenu = value;
  }
}
