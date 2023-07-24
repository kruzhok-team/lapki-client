import { Rectangle } from '@renderer/types/graphics';
import { Container } from '../basic/Container';
import { isPointInRectangle } from '../utils';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { Events } from './Events';

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

  parent?: Draggable;
  children: Map<string, Draggable> = new Map();

  dragging = false;

  private isMouseDown = false;

  childrenPadding = 15;

  constructor(container: Container, bounds: Rectangle, parent?: Draggable) {
    super();

    this.container = container;
    this.bounds = bounds;
    this.parent = parent;

    this.container.app.mouse.on('mouseup', this.handleMouseUp);
    this.container.app.mouse.on('mousedown', this.handleMouseDown);
    this.container.app.mouse.on('mousemove', this.handleMouseMove);
    this.container.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.container.app.mouse.on('contextmenu', this.handleContextMenuClick);
  }

  // Позиция рассчитанная с возможным родителем
  private get compoundPosition() {
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
    let width = this.computedWidth;
    let height = this.computedHeight;
    let childrenHeight = this.childrenContainerHeight;

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

    this.dragging = true;

    this.isMouseDown = true;

    this.emit('mousedown', { event: e, target: this });
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
    this.container.app.isDirty = true;
  };

  handleMouseUp = (e: MyMouseEvent) => {
    this.dragging = false;

    document.body.style.cursor = 'default';

    const isUnderMouse = this.isUnderMouse(e);

    if (!isUnderMouse) return;

    this.emit('mouseup', { event: e, target: this });

    this.emit('click', { event: e, target: this });
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

    this.emit('contextmenu', { event: e, target: this });
  };

  isUnderMouse({ x, y }: MyMouseEvent) {
    return isPointInRectangle(this.drawBounds, { x, y });
  }
}
