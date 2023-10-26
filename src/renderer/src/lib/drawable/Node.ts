import { Point, Rectangle } from '@renderer/types/graphics';

import { Children } from './Children';

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
 * @privateRemarks
 * Сначала это задумывался как класс для разруливания квадратиков,
 * которые можно перемещать, но потом он вырос в кашу из-за добавления
 * вложенных стейтов.
 *
 * TODO: Это явно нужно переделать.
 */

interface NodeEvents {
  mousedown: { event: MyMouseEvent };
  mouseup: { event: MyMouseEvent };
  click: { event: MyMouseEvent };
  dblclick: { event: MyMouseEvent };
  contextmenu: { event: MyMouseEvent };
  longpress: { event: MyMouseEvent };
  dragend: { dragStartPosition: Point; dragEndPosition: Point };
}

export abstract class Node extends EventEmitter<NodeEvents> {
  container!: Container;
  id!: string;
  children!: Children;
  parent?: Node;

  private dragStartPosition: Point | null = null;

  private isMouseDown = false;

  private mouseDownTimerId: ReturnType<typeof setTimeout> | undefined = undefined;
  longPressTimeout = 2000;

  childrenPadding = 15;

  constructor(container: Container, id: string, parent?: Node) {
    super();

    this.container = container;
    this.id = id;
    this.parent = parent;
    this.children = new Children(this.container.machineController);
  }

  abstract get bounds(): Rectangle;
  abstract set bounds(bounds: Rectangle);

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
      x: (x + this.container.app.manager.data.offset.x) / this.container.app.manager.data.scale,
      y: (y + this.container.app.manager.data.offset.y) / this.container.app.manager.data.scale,
    };
  }

  get computedWidth() {
    let width = this.bounds.width / this.container.app.manager.data.scale;
    if (!this.children.isEmpty) {
      let rightChildren = this.children.getByIndex(0)!;

      this.children.forEach((children) => {
        const x = children.computedPosition.x;
        const width = children.computedWidth;

        if (x + width > rightChildren.computedPosition.x + rightChildren.computedWidth) {
          rightChildren = children;
        }
      });

      const x = this.computedPosition.x;
      const cx = rightChildren.computedPosition.x;

      width = Math.max(
        width,
        cx +
          rightChildren.computedDimensions.width -
          x +
          this.childrenPadding / this.container.app.manager.data.scale
      );
    }

    return width;
  }

  get computedHeight() {
    return this.bounds.height / this.container.app.manager.data.scale;
  }

  get childrenContainerHeight() {
    if (this.children.isEmpty) return 0;

    let bottomChild = this.children.getByIndex(0)!;
    let result = 0;

    this.children.forEach((child) => {
      const y = child.bounds.y;
      const height = child.bounds.height;
      const childrenContainerHeight = child.childrenContainerHeight;

      const bY = bottomChild.bounds.y;
      const bHeight = bottomChild.bounds.height;
      const bChildrenContainerHeight = bottomChild.childrenContainerHeight;

      if (y + height + childrenContainerHeight > bY + bHeight + bChildrenContainerHeight) {
        bottomChild = child;
      }
    });

    result =
      (bottomChild.bounds.y + bottomChild.bounds.height + this.childrenPadding * 2) /
        this.container.app.manager.data.scale +
      bottomChild.childrenContainerHeight;

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

  private dragEnd() {
    const dragEndPosition = { x: this.bounds.x, y: this.bounds.y };
    if (
      this.dragStartPosition &&
      (dragEndPosition.x !== this.dragStartPosition.x ||
        dragEndPosition.y !== this.dragStartPosition.y)
    ) {
      this.emit('dragend', {
        dragStartPosition: this.dragStartPosition,
        dragEndPosition,
      });
    }
  }

  handleMouseDown = (e: MyMouseEvent) => {
    this.isMouseDown = true;
    this.dragStartPosition = { x: this.bounds.x, y: this.bounds.y };

    clearTimeout(this.mouseDownTimerId);

    this.mouseDownTimerId = setTimeout(() => {
      this.emit('longpress', { event: e });
    }, this.longPressTimeout);

    this.emit('mousedown', { event: e });

    this.emit('click', { event: e });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.isMouseDown) return;

    if (Math.abs(e.dx) > 1 && Math.abs(e.dy) > 1) {
      clearTimeout(this.mouseDownTimerId);
    }

    this.bounds = {
      width: this.bounds.width,
      height: this.bounds.height,
      x: this.bounds.x + e.dx * this.container.app.manager.data.scale,
      y: this.bounds.y + e.dy * this.container.app.manager.data.scale,
    };

    if (this.parent) {
      this.bounds = {
        width: this.bounds.width,
        height: this.bounds.height,
        x: Math.max(0, this.bounds.x),
        y: Math.max(0, this.bounds.y),
      };
    }
  };

  handleMouseUp = (e: MyMouseEvent) => {
    clearTimeout(this.mouseDownTimerId);

    this.emit('mouseup', { event: e });

    if (this.isMouseDown) {
      this.isMouseDown = false;
      this.dragEnd();
      this.emit('click', { event: e });
    }
  };

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    this.emit('dblclick', { event: e });
  };

  handleMouseContextMenu = (e: MyMouseEvent) => {
    this.emit('contextmenu', { event: e });
  };

  isUnderMouse<T extends Point>({ x, y }: T, withChildren?: boolean) {
    const drawBounds = this.drawBounds;
    const bounds = !withChildren
      ? drawBounds
      : { ...drawBounds, height: drawBounds.height + drawBounds.childrenHeight };
    return isPointInRectangle(bounds, { x, y });
  }

  getIntersection(position: Point): Node | null {
    const drawBounds = this.drawBounds;

    if (isPointInRectangle(drawBounds, position)) {
      return this;
    }

    const end = this.children.size - 1;

    for (let i = end; i >= 0; i--) {
      const node = this.children.getByIndex(i)?.getIntersection(position);

      if (node) return node;
    }

    return null;
  }

  /**
   * Как глубоко нодв в дереве children
   */
  getDepth() {
    let depth = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this as Node;
    while (node.parent) {
      depth += 1;
      node = node.parent;
    }

    return depth;
  }
}
