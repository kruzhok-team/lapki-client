import { State as StateType } from '@renderer/types/diagram';

import { Draggable } from './Draggable';
import { EdgeHandlers } from './EdgeHandlers';
import { Events } from './Events';
import { picto } from './Picto';

import { Container } from '../basic/Container';
import theme from '@renderer/theme';

const style = theme.colors.diagram.state;

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
  data!: StateType;
  isInitial = false;
  isSelected = false;
  eventBox!: Events;
  edgeHandlers!: EdgeHandlers;
  onEnter?: HTMLImageElement;
  onExit?: HTMLImageElement;
  DiodOn?: HTMLImageElement;
  DiodOff?: HTMLImageElement;

  toJSON(): StateType {
    return {
      parent: this.data.parent,
      name: this.data.name,
      events: this.data.events,
      bounds: this.bounds, // FIXME: должны учитывать дочерний контейнер?
    };
  }

  constructor({ id, container, data, parent, initial = false }: StateProps) {
    super(container, { ...data.bounds, width: 230, height: 100 }, id, parent);
    this.data = data;
    this.container = container;

    this.eventBox = new Events(this.container, this, this.data.events);
    this.updateEventBox();
    this.edgeHandlers = new EdgeHandlers(container.app, this);

    if (initial) {
      this.isInitial = true;
      this.container.isDirty = true;
    }
  }

  updateEventBox() {
    this.eventBox.recalculate();
    // console.log(['State.updateEventBox', this.id, this.bounds, this.eventBox.bounds]);
    this.bounds.width = Math.max(
      this.bounds.width,
      this.eventBox.bounds.width + this.eventBox.bounds.x
    );
    const calcHeight = this.titleHeight + this.eventBox.bounds.height + this.eventBox.bounds.y;
    // this.bounds.height = Math.max(this.bounds.height, calcHeight);
    this.bounds.height = calcHeight;
    // console.log(['/State.updateEventBox', this.id, this.bounds]);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawBody(ctx);
    this.drawTitle(ctx);
    this.eventBox.draw(ctx);

    if (this.isInitial) {
      this.drawInitialMark(ctx);
    }

    if (this.children) {
      this.drawChildren(ctx, canvas);
    }

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
    }
  }

  //Прорисовка блока состояния
  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = style.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, [
      6,
      6,
      this.children.size !== 0 ? 0 : 6,
      this.children.size !== 0 ? 0 : 6,
    ]);
    ctx.fill();

    ctx.closePath();
  }

  get titleHeight() {
    const fontSize = 15;
    const paddingY = 10;
    return fontSize + paddingY * 2;
  }

  //Прорисовка заголовка блока состояния
  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y, width } = this.drawBounds;

    const fontSize = 15 / this.container.scale;
    const paddingY = 10 / this.container.scale;
    const paddingX = 15 / this.container.scale;
    const titleHeight = this.titleHeight / this.container.scale;

    ctx.font = `${fontSize}px/0 Fira Sans`;
    ctx.textBaseline = 'hanging';

    ctx.beginPath();

    ctx.fillStyle = style.titleBg;

    ctx.roundRect(x, y, width, titleHeight, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = style.titleColor;
    ctx.fillText(this.data.name, x + paddingX, y + paddingY);

    ctx.closePath();
  }

  //Обводка блока состояния при нажатии
  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;
    ctx.canvas.hidden;

    ctx.lineWidth = 2;
    ctx.strokeStyle = style.selectedBorderColor;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height + childrenHeight, 6);
    ctx.stroke();
    ctx.closePath();

    // Этот код рисует пояснялку, которая здесь не нужна.
    /*
    //Начало рисования
    ctx.beginPath();
    //Добавляет стиль заднему фону
    ctx.fillStyle = style.bodyBg;
    //создает указательный треугольник
    ctx.moveTo(x + 100 / this.container.scale, y - 20 / this.container.scale);
    ctx.lineTo(x + 110 / this.container.scale, y - 2 / this.container.scale);
    ctx.lineTo(x + 120 / this.container.scale, y - 20 / this.container.scale);
    //Строит прямоугольник
    ctx.roundRect(
      x,
      y - 120 / this.container.scale,
      width,
      100 / this.container.scale,
      transitionStyle.startSize
    );
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
    */
  }

  //Дополнять внешними border при добавлении дочерних состояний
  private drawChildren(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (this.children.size === 0) return;

    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = 2;
    ctx.strokeStyle = style.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + height, width - 2, childrenHeight, [0, 0, 6, 6]);
    ctx.stroke();

    ctx.closePath();
  }

  private drawInitialMark(ctx: CanvasRenderingContext2D) {
    if (!this.isInitial) return;

    const { x, y } = this.drawBounds;

    ctx.beginPath();
    picto.drawImage(ctx, 'InitialIcon', {
      x: x - 30 / this.container.scale,
      y,
      width: 25,
      height: 25,
    });
    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
