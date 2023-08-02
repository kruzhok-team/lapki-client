import { Point, Rectangle } from '@renderer/types/graphics';

import { Events } from './Events';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { isPointInRectangle } from '../utils';

/**
 * Перемещаемый элемент холста.
 * Класс реализует перемещение фигуры с помощью мыши и рассчитывает
 * размеры элемента с учётом вложенности.
 * Внутри класс подписывается на события мыши и фильтрует относящиеся
 * к своему объекту.
 * При размещении на холсте класс учитывает панораму и зум холста.
 *
 * @remark
 * Сначала это задумывался как класс для разруливания квадратиков,
 * которые можно перемещать, но потом он вырос в кашу из-за добавления
 * вложенных стейтов.
 *
 * TODO: Это явно нужно передать.
 */

export class Draggable extends EventEmitter {
  container!: Container;
  statusevents!: Events;
  bounds!: Rectangle;
  id?: string;
  parent?: Draggable;
  children: Map<string, Draggable> = new Map();

  dragging = false;

  private isMouseDown = false;

  private mouseDownTimerId: ReturnType<typeof setTimeout> | undefined = undefined;
  longPressTimeout = 2000;

  childrenPadding = 15;

  constructor(container: Container, bounds: Rectangle, id?: string, parent?: Draggable) {
    super();

    this.container = container;
    this.bounds = bounds;
    this.id = id;
    this.parent = parent;

    this.bindEvents();
  }

  bindEvents() {
    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousedown', this.handleMouseDown);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);
    this.container.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.container.app.mouse.on('contextmenu', this.handleContextMenuClick);
  }

  unbindEvents() {
    this.container.app.mouse.off('mouseup', this.handleMouseUp);
    this.container.app.mouse.off('mousedown', this.handleMouseDown);
    this.container.app.mouse.off('mousemove', this.handleMouseMove);
    this.container.app.mouse.off('dblclick', this.handleMouseDoubleClick);
    this.container.app.mouse.off('contextmenu', this.handleContextMenuClick);
  }

  // Позиция рассчитанная с возможным родителем
  get compoundPosition() {
    let x = this.bounds.x;
    let y = this.bounds.y;

    if (this.parent) {
      const { x: px, y: py } = this.parent.compoundPosition;

      x += px + this.childrenPadding;
      y += py + this.parent.bounds.height + this.childrenPadding;
    }

    return { x, y };
  }

  get computedPosition() {
    const { x, y } = this.compoundPosition;

    return {
      x: (x + this.container.offset.x) / this.container.scale,
      y: (y + this.container.offset.y) / this.container.scale,
    };
  }

  get computedWidth() {
    let width = this.bounds.width / this.container.scale;

    if (this.children.size > 0) {
      let rightChildren = this.children.values().next().value as Draggable;

      this.children.forEach((children) => {
        const x = children.computedPosition.x;
        const width = children.computedWidth;

        if (x + width > rightChildren.computedPosition.x + rightChildren.computedWidth) {
          rightChildren = children;
        }
      });

      const x = this.computedPosition.x;
      const cx = rightChildren.computedPosition.x;

      width =
        cx +
        rightChildren.computedDimensions.width -
        x +
        this.childrenPadding / this.container.scale;
    }

    return width;
  }

  get computedHeight() {
    return this.bounds.height / this.container.scale;
  }

  get childrenContainerHeight() {
    if (this.children.size < 1) return 0;

    let bottomChildren = this.children.values().next().value as Draggable;
    let result = 0;

    this.children.forEach((children) => {
      const y = children.computedPosition.y;
      const height = children.computedHeight;
      const childrenContainerHeight = children.childrenContainerHeight;

      const bY = bottomChildren.computedPosition.y;
      const bHeight = bottomChildren.computedHeight;
      const bChildrenContainerHeight = bottomChildren.childrenContainerHeight;

      if (y + height + childrenContainerHeight > bY + bHeight + bChildrenContainerHeight) {
        bottomChildren = children;
      }
    });

    const y = this.computedPosition.y;
    const cy = bottomChildren.computedPosition.y;
    const childrenContainerHeight = bottomChildren.childrenContainerHeight;

    result = cy + childrenContainerHeight + this.childrenPadding / this.container.scale - y;

    return result;
  }

  get computedDimensions() {
    const width = this.computedWidth;
    const height = this.computedHeight;
    const childrenHeight = this.childrenContainerHeight;

    return { width, height, childrenHeight };
  }

  get drawBounds() {
    return {
      ...this.computedPosition,
      ...this.computedDimensions,
    };
  }

  handleMouseDown = (e: MyMouseEvent) => {
    if (!e.left) return;

    const isUnderMouse = this.isUnderMouse(e);

    if (!isUnderMouse) return;
    document.body.style.cursor = 'grabbing';
    // для того что-бы не хватать несколько элементов
    e.stopPropagation();

    // А это чтобы закрыть ненужное контекстное меню.
    // Если контекстное меню начнёт закрываться само по себе,
    // вы нарушили вселенский порядок событий, и эта строка
    // вызывается позже, чем открывается новое меню.
    this.container.closeContextMenu();

    this.dragging = true;

    this.isMouseDown = true;

    clearTimeout(this.mouseDownTimerId);

    this.mouseDownTimerId = setTimeout(() => {
      this.emit('longpress', { event: e, target: this });
    }, this.longPressTimeout);

    this.emit('mousedown', { event: e, target: this });

    this.emit('click', { event: e, target: this });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.dragging || this.container.isPan) return;

    this.bounds.x += e.dx * this.container.scale;
    this.bounds.y += e.dy * this.container.scale;

    if (this.parent) {
      this.bounds.x = Math.max(0, this.bounds.x);
      this.bounds.y = Math.max(0, this.bounds.y);
    }

    document.body.style.cursor = 'grabbing';
    this.container.isDirty = true;
  };

  handleMouseUp = (e: MyMouseEvent) => {
    this.dragging = false;

    document.body.style.cursor = 'default';

    const isUnderMouse = this.isUnderMouse(e);

    if (!isUnderMouse) return;

    e.stopPropagation();

    clearTimeout(this.mouseDownTimerId);

    this.emit('mouseup', { event: e, target: this });

    if (this.isMouseDown) {
      this.isMouseDown = false;
      this.emit('click', { event: e, target: this });
    }
  };

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    const isUnderMouse = this.isUnderMouse(e);
    if (!isUnderMouse) return;

    // TODO: возможна коллизия с mouseup и click, нужно тестировать
    this.emit('dblclick', { event: e, target: this });
  };

  handleContextMenuClick = (e: MyMouseEvent) => {
    const isUnderMouse = this.isUnderMouse(e);
    if (!isUnderMouse) return;

    e.stopPropagation();

    this.emit('contextmenu', { event: e, target: this });
  };

  isUnderMouse<T extends Point>({ x, y }: T, withChildren?: boolean) {
    const drawBounds = this.drawBounds;
    const bounds = !withChildren
      ? drawBounds
      : { ...drawBounds, height: drawBounds.height + drawBounds.childrenHeight };
    return isPointInRectangle(bounds, { x, y });
  }
}
