import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import { Condition as ConditionType } from '@renderer/types/diagram';
import { Draggable } from './Draggable';
import { ContextMenu } from './ContextMenu';

/**
 * Условие перехода (т.е. подпись ребра машины состояний).
 * Перемещаемый элемент схемы, выполняет отрисовку и
 * обработку событий мыши.
 */
export class Condition extends Draggable {
  data!: ConditionType;
  contextmenu!: ContextMenu;

  //Сюда закладываются получаемые данные при клике на связь и выводятся над ней
  isCondition;
  //Проверка нажатия на левую кнопку мыши для выделения связи
  isSelected = false;
  //Проверка нажатия на правую кнопку мыши для вывода контексного меню
  isSelectedMenu = false;

  constructor(container: Container, data: ConditionType) {
    super(container, {
      x: data.position.x,
      y: data.position.y,
      width: 150,
      height: 70,
    });

    this.data = data;
    this.contextmenu = new ContextMenu(container, this);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { x, y, width, height } = this.drawBounds;
    const p = 15 / this.container.scale;
    const fontSize = stateStyle.titleFontSize / this.container.scale;
    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    ctx.beginPath();
    ctx.fillText(this.data.component, x + p, y + p);
    ctx.fillText(this.data.method, x + p, y + fontSize + p);
    ctx.closePath();

    if (this.isSelected) {
      this.drawSelection(ctx);
    }

    if (this.isSelectedMenu) {
      this.contextmenu.draw(ctx);
    }
  }

  //!!!Оказывается для каждого нового объекта рисования требуется указывать их начало и конец и перед ними прописывать стили!!!
  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.beginPath();
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.roundRect(x, y, width, height + childrenHeight, transitionStyle.startSize);
    ctx.stroke();
    ctx.closePath();

    //Начало рисования
    ctx.beginPath();
    //Добавляет стиль заднему фону
    ctx.fillStyle = stateStyle.bodyBg;
    //создает указательный треугольник
    ctx.moveTo(x + 60 / this.container.scale, y - 20 / this.container.scale);
    ctx.lineTo(x + 70 / this.container.scale, y - 2 / this.container.scale);
    ctx.lineTo(x + 80 / this.container.scale, y - 20 / this.container.scale);
    //Строит прямоугольник
    ctx.roundRect(
      x,
      y - 90 / this.container.scale,
      width,
      height + childrenHeight,
      transitionStyle.startSize
    );
    //Добавляет задний фон объекту канвы
    ctx.fill();
    //Конец рисования
    ctx.closePath();

    ctx.beginPath();
    //Добавляет стиль тексту
    ctx.fillStyle = transitionStyle.bgColor;
    ctx.fillText(this.isCondition, x, y - 80 / this.container.scale);
    //Добавляет задний фон объекту канвы
    ctx.fill();
    ctx.closePath();
  }

  toJSON() {
    return {
      position: {
        x: this.bounds.x,
        y: this.bounds.y,
      },
      component: this.data.component,
      method: this.data.method,
    };
  }

  setIsSelected(value: boolean, target: string) {
    this.isSelected = value;
    this.isCondition = target;
  }

  setIsSelectedMenu(value: boolean) {
    this.isSelectedMenu = value;
  }
}
