import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Events, EdgeHandlers, icons } from '@renderer/lib/drawable';
import { Shape } from '@renderer/lib/drawable/Shape';
import { stateStyle } from '@renderer/lib/styles';
import { drawCircle } from '@renderer/lib/utils';
import { drawText } from '@renderer/lib/utils/text';
import theme, { getColor } from '@renderer/theme';
import { State as DataState } from '@renderer/types/diagram';
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
  data: DataState;
  smId: string;
  constructor(app: CanvasEditor, id: string, smId: string, data: DataState, parent?: Shape) {
    super(app, id, parent);
    this.smId = smId;
    this.data = data;
    this.eventBox = new Events(this.app as CanvasEditor, this);
    this.updateEventBox();
    this.edgeHandlers = new EdgeHandlers(this.app as CanvasEditor, this);
  }

  get scale() {
    return this.app.controller.scale;
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
    this.eventBox.update();

    this.dimensions = {
      width: this.dimensions.width,
      height: Math.max(stateStyle.height, this.eventBox.dimensions.height + this.titleHeight),
    };
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

    if (this.app.controller.states.dragInfo?.parentId === this.id) {
      this.drawHighlight(ctx);
    }
    if (this.parent) {
      drawCircle(ctx, { position: this.compoundPosition, radius: 3, fillStyle: '#00FF00' });
    }
  }

  //Прорисовка блока состояния
  private drawBody(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;

    ctx.fillStyle = style.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, [
      6 / this.scale,
      6 / this.scale,
      (this.children.isEmpty ? 6 : 0) / this.scale,
      (this.children.isEmpty ? 6 : 0) / this.scale,
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
      height: this.titleHeight / this.scale,
      width: this.drawBounds.width,
      fontSize: 15 / this.scale,
      paddingX: 15 / this.scale,
      paddingY: 10 / this.scale,
    };
  }

  //Прорисовка заголовка блока состояния
  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.drawBounds;

    const { height, width, fontSize, paddingX, paddingY } = this.computedTitleSizes;

    ctx.beginPath();

    ctx.fillStyle = style.titleBg;

    ctx.roundRect(x, y, width, height, [6 / this.scale, 6 / this.scale, 0, 0]);
    ctx.fill();

    drawText(ctx, this.data.name || 'Без названия', {
      x: x + paddingX,
      y: y + paddingY,
      textAlign: 'left',
      color: this.data.name !== '' ? style.titleColor : style.titleColorUndefined,
      font: {
        fontSize,
        lineHeight: 1,
        fontFamily: 'Fira Sans',
      },
    });

    ctx.closePath();
  }

  //Обводка блока состояния при нажатии
  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = 2;
    ctx.strokeStyle = this.data.color ?? getColor('default-state-color');

    ctx.beginPath();
    ctx.roundRect(x, y, width, height + childrenHeight, 6 / this.scale);
    ctx.stroke();
    ctx.closePath();

    // Этот код рисует пояснялку, которая здесь не нужна.
    /*
    //Начало рисования
    ctx.beginPath();
    //Добавляет стиль заднему фону
    ctx.fillStyle = style.bodyBg;
    //создает указательный треугольник
    ctx.moveTo(x + 100 / this.app.model.data.scale, y - 20 / this.app.model.data.scale);
    ctx.lineTo(x + 110 / this.app.model.data.scale, y - 2 / this.app.model.data.scale);
    ctx.lineTo(x + 120 / this.app.model.data.scale, y - 20 / this.app.model.data.scale);
    //Строит прямоугольник
    ctx.roundRect(
      x,
      y - 120 / this.app.model.data.scale,
      width,
      100 / this.app.model.data.scale,
      transitionStyle.startSize
    );
    //Добавляет задний фон объекту канвы
    ctx.fill();
    //Конец рисования
    ctx.closePath();

    ctx.beginPath();
    //Добавляет стиль тексту
    ctx.fillStyle = transitionStyle.bgColor;
    ctx.fillText(this.isState, x, y - 80 / this.app.model.data.scale);
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
    ctx.roundRect(x, y, width, height + childrenHeight, 6 / this.scale);
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
      6 / this.scale,
      6 / this.scale,
    ]);
    ctx.stroke();

    ctx.closePath();
  }

  private drawPen(ctx: CanvasRenderingContext2D) {
    const icon = icons.get('pen');
    if (!icon) return;

    const { x, y } = this.drawBounds;
    const { width } = this.computedTitleSizes;
    const size = 16 / this.scale;
    const p = 9 / this.scale;

    ctx.beginPath();
    ctx.fillStyle = style.titleColor;
    ctx.strokeStyle = style.titleColor;

    ctx.drawImage(icon, x + width - size - p, y + p, size, size);

    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;

    this.edgeHandlers.disabled = value;
  }
}
