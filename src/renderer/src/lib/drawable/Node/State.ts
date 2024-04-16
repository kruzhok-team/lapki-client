import { EditorView } from '@renderer/lib/basic';
import { Events, EdgeHandlers, icons } from '@renderer/lib/drawable';
import { Shape } from '@renderer/lib/drawable/Shape';
import { drawText } from '@renderer/lib/utils/text';
import theme, { getColor } from '@renderer/theme';

const style = theme.colors.diagram.state;

/**
 * Нода машины состояний.
 * Класс выполняет отрисовку, обработку событий (за счёт {@link Shape}),
 * управление собственным выделением и отображение «хваталок».
 */
export class State extends Shape {
  isSelected = false;
  eventBox!: Events;
  edgeHandlers!: EdgeHandlers;

  constructor(view: EditorView, id: string, parent?: Shape) {
    super(view, id, parent);

    this.eventBox = new Events(this.view, this);
    this.updateEventBox();
    this.edgeHandlers = new EdgeHandlers(view.app, this);
  }

  get data() {
    return this.view.app.model.data.elements.states[this.id];
  }

  get position() {
    return this.data.position;
  }
  set position(value) {
    this.data.position = value;
  }
  get dimensions() {
    return this.data.dimensions;
  }
  set dimensions(value) {
    this.data.dimensions = value;
  }

  updateEventBox() {
    this.eventBox.recalculate();
    // console.log(['State.updateEventBox', this.id, this.bounds, this.eventBox.bounds]);
    const calcHeight = this.titleHeight + this.eventBox.bounds.height + this.eventBox.bounds.y;

    this.dimensions = {
      height: calcHeight,
      width: Math.max(this.dimensions.width, this.eventBox.bounds.width + this.eventBox.bounds.x),
    };

    // this.bounds.height = Math.max(this.bounds.height, calcHeight);
    // console.log(['/State.updateEventBox', this.id, this.bounds]);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawBody(ctx);
    this.drawTitle(ctx);
    this.drawPen(ctx);
    this.eventBox.draw(ctx);

    if (!this.children.isEmpty) {
      this.drawChildren(ctx, canvas);
    }

    if (this.isSelected) {
      this.drawSelection(ctx);
      this.edgeHandlers.draw(ctx);
    }

    if (this.view.controller.states.dragInfo?.parentId === this.id) {
      this.drawHighlight(ctx);
    }
  }

  //Прорисовка блока состояния
  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = style.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, [
      6 / this.view.app.model.data.scale,
      6 / this.view.app.model.data.scale,
      (this.children.isEmpty ? 6 : 0) / this.view.app.model.data.scale,
      (this.children.isEmpty ? 6 : 0) / this.view.app.model.data.scale,
    ]);
    ctx.fill();

    ctx.closePath();
  }

  get titleHeight() {
    const fontSize = 15;
    const paddingY = 10;
    return fontSize + paddingY * 2;
  }

  get computedTitleSizes() {
    return {
      height: this.titleHeight / this.view.app.model.data.scale,
      width: this.drawBounds.width,
      fontSize: 15 / this.view.app.model.data.scale,
      paddingX: 15 / this.view.app.model.data.scale,
      paddingY: 10 / this.view.app.model.data.scale,
    };
  }

  //Прорисовка заголовка блока состояния
  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.drawBounds;

    const { height, width, fontSize, paddingX, paddingY } = this.computedTitleSizes;

    ctx.beginPath();

    ctx.fillStyle = style.titleBg;

    ctx.roundRect(x, y, width, height, [
      6 / this.view.app.model.data.scale,
      6 / this.view.app.model.data.scale,
      0,
      0,
    ]);
    ctx.fill();

    drawText(ctx, this.data.name || 'Без названия', {
      x: x + paddingX,
      y: y + paddingY,
      textAlign: 'left',
      color: this.data.name !== '' ? style.titleColor : style.titleColorUndefined,
      font: `${fontSize}px/1 'Fira Sans'`,
    });

    ctx.closePath();
  }

  //Обводка блока состояния при нажатии
  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;
    ctx.canvas.hidden;

    ctx.lineWidth = 2;
    ctx.strokeStyle = this.data.color;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height + childrenHeight, 6 / this.view.app.model.data.scale);
    ctx.stroke();
    ctx.closePath();

    // Этот код рисует пояснялку, которая здесь не нужна.
    /*
    //Начало рисования
    ctx.beginPath();
    //Добавляет стиль заднему фону
    ctx.fillStyle = style.bodyBg;
    //создает указательный треугольник
    ctx.moveTo(x + 100 / this.view.app.model.data.scale, y - 20 / this.view.app.model.data.scale);
    ctx.lineTo(x + 110 / this.view.app.model.data.scale, y - 2 / this.view.app.model.data.scale);
    ctx.lineTo(x + 120 / this.view.app.model.data.scale, y - 20 / this.view.app.model.data.scale);
    //Строит прямоугольник
    ctx.roundRect(
      x,
      y - 120 / this.view.app.model.data.scale,
      width,
      100 / this.view.app.model.data.scale,
      transitionStyle.startSize
    );
    //Добавляет задний фон объекту канвы
    ctx.fill();
    //Конец рисования
    ctx.closePath();

    ctx.beginPath();
    //Добавляет стиль тексту
    ctx.fillStyle = transitionStyle.bgColor;
    ctx.fillText(this.isState, x, y - 80 / this.view.app.model.data.scale);
    //Добавляет задний фон объекту канвы
    ctx.fill();
    ctx.closePath();
    */
  }

  private drawHighlight(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;
    ctx.canvas.hidden;

    ctx.lineWidth = 2;
    ctx.strokeStyle = getColor('primaryActive');

    ctx.beginPath();
    ctx.roundRect(x, y, width, height + childrenHeight, 6 / this.view.app.model.data.scale);
    ctx.stroke();
    ctx.closePath();
  }

  //Дополнять внешними border при добавлении дочерних состояний
  private drawChildren(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = 2;
    ctx.strokeStyle = style.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + height, width - 2, childrenHeight, [
      0,
      0,
      6 / this.view.app.model.data.scale,
      6 / this.view.app.model.data.scale,
    ]);
    ctx.stroke();

    ctx.closePath();
  }

  private drawPen(ctx: CanvasRenderingContext2D) {
    const icon = icons.get('pen');
    if (!icon) return;

    const { x, y } = this.drawBounds;
    const { width } = this.computedTitleSizes;
    const size = 16 / this.view.app.model.data.scale;
    const p = 9 / this.view.app.model.data.scale;

    ctx.beginPath();
    ctx.fillStyle = style.titleColor;
    ctx.strokeStyle = style.titleColor;

    ctx.drawImage(icon, x + width - size - p, y + p, size, size);

    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
