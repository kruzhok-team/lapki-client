import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape, icons } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { isPointInRectangle } from '@renderer/lib/utils';

/**
 * «Хваталки» для ноды, надстройка над State, отрисовывающая
 * элементы, позволяющие создать новый переход путём drag-n-drop.
 *
 * @privateRemarks
 * TODO: Возможно эти штуки нужно переделать на обычные dom div?
 */
export class EdgeHandlers {
  app!: CanvasEditor;
  shape!: Shape;

  disabled = true;
  isBinded = false;
  onStartNewTransition?: () => void;

  constructor(app: CanvasEditor, shape: Shape) {
    this.app = app;
    this.shape = shape;
  }

  /*
    Записки разработчиков.

    Когда мы пытались удалить МС, вкладка с которой была закрыта, мы ловили ошибку инициализации мыши.
    Почему это происходило? 
    1. Когда мы закрываем вкладку, у нас происходит unmount канваса, происходит отписка от событий mouse всех
    элементов диаграммы, затем mouse удалялась. Затем, когда мы хотим удалить МС, редактор которой закрыли, то
    мы пытаемся отписаться от событий мыши, которая уже равна undefined.
    2. Если мы не открывали редактор МС и удаляли ее, то мышь никогда и не инициализировалась.

    А теперь вопрос - почему отписка работает в других местах? Ведь у нас все элементы так или иначе взаимодействуют с мышью,
    но проблема появляется только в EdgeHandlers. Потому что все другие элементы наследованы от класса Shape, который напрямую
    не подписывается на события мыши. EditorView отлавливает события мыши и вызывает соответствующие функции у Shape.
    А EditorView отписывается от мыши и клавиатуры раньше всех.

    Пофиксили это добавлением флага, мы делаем unbind если делаем unmount. 
    И при отписке во время удаления элемента мы в unbind больше не заходим (или если не делали mount вообще).
  */
  bindEvents() {
    if (!this.isBinded) {
      this.isBinded = true;
      this.app.mouse.on('mousedown', this.handleMouseDown);
    }
  }

  unbindEvents() {
    if (this.isBinded) {
      this.isBinded = false;
      this.app.mouse.off('mousedown', this.handleMouseDown);
    }
  }

  get position(): Point[] {
    const offset = 4 / this.app.controller.scale;
    let { x, y, width, height, childrenHeight } = this.shape.drawBounds;

    height = childrenHeight !== 0 ? childrenHeight : height;

    return [
      {
        x: x + width / 2 - this.size / 2,
        y: y - this.size - offset,
      },
      {
        x: x + width / 2 - this.size / 2,
        y: y + height + offset,
      },
      {
        x: x - this.size - offset,
        y: y + height / 2 - this.size / 2,
      },
      {
        x: x + width + offset,
        y: y + height / 2 - this.size / 2,
      },
    ];
  }

  get size() {
    return 20 / this.app.controller.scale;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const icon = icons.get('EdgeHandle');
    if (!icon) return;

    ctx.beginPath();

    for (const { x, y } of this.position) {
      ctx.drawImage(icon, x, y, this.size, this.size);
    }

    ctx.fillStyle = '#FFF';
    ctx.fill();

    ctx.closePath();
  }

  handleMouseDown = (e: MyMouseEvent) => {
    if (!this.disabled || !this.isMouseOver(e)) return;

    e.stopPropagation();

    this.onStartNewTransition?.();
  };

  isMouseOver(e: MyMouseEvent) {
    for (const { x, y } of this.position) {
      if (isPointInRectangle({ x, y, width: this.size, height: this.size }, { x: e.x, y: e.y })) {
        return true;
      }
    }

    return false;
  }
}
