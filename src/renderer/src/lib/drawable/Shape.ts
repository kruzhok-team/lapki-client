import { getCapturedNodeArgs } from '@renderer/types/drawable';
import { Dimensions, Point, Rectangle } from '@renderer/types/graphics';
import { MyMouseEvent } from '@renderer/types/mouse';

import { Children } from './Children';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
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

interface ShapeEvents {
  mousedown: { event: MyMouseEvent };
  mouseup: { event: MyMouseEvent };
  click: { event: MyMouseEvent };
  dblclick: { event: MyMouseEvent };
  contextmenu: { event: MyMouseEvent };
  longpress: { event: MyMouseEvent };
  drag: { event: MyMouseEvent };
  dragend: { dragStartPosition: Point; dragEndPosition: Point };
}

export abstract class Shape extends EventEmitter<ShapeEvents> {
  container!: Container;
  id!: string;
  children!: Children;
  parent?: Shape;

  private dragStartPosition: Point | null = null;

  private isMouseDown = false;

  private mouseDownTimerId: ReturnType<typeof setTimeout> | undefined = undefined;
  longPressTimeout = 2000;

  childrenPadding = 15;

  constructor(container: Container, id: string, parent?: Shape) {
    super();

    this.container = container;
    this.id = id;
    this.parent = parent;
    this.children = new Children(this.container.machineController);
  }

  abstract get position(): Point;
  abstract set position(value: Point);

  abstract get dimensions(): Dimensions;
  abstract set dimensions(value: Dimensions);

  // abstract get bounds(): Rectangle;
  // abstract set bounds(bounds: Rectangle);
  abstract draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): unknown;

  // Позиция рассчитанная с возможным родителем
  get compoundPosition() {
    let { x, y } = this.position;

    if (this.parent) {
      const { x: px, y: py } = this.parent.compoundPosition;

      x += px + this.childrenPadding;
      y += py + this.parent.dimensions.height + this.childrenPadding;
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
    let width = this.dimensions.width / this.container.app.manager.data.scale;
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
    return this.dimensions.height / this.container.app.manager.data.scale;
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
    const dragEndPosition = { ...this.position };
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
    this.dragStartPosition = { ...this.position };

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

    this.position = {
      x: this.position.x + e.dx * this.container.app.manager.data.scale,
      y: this.position.y + e.dy * this.container.app.manager.data.scale,
    };

    if (this.parent) {
      this.position = {
        x: Math.max(0, this.position.x),
        y: Math.max(0, this.position.y),
      };
    }

    this.emit('drag', { event: e });
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

  isUnderMouse({ x, y }: Point, includeChildrenHeight?: boolean) {
    const drawBounds = this.drawBounds;
    const bounds = !includeChildrenHeight
      ? drawBounds
      : { ...drawBounds, height: drawBounds.height + drawBounds.childrenHeight };
    return isPointInRectangle(bounds, { x, y });
  }

  getCapturedNode(args: getCapturedNodeArgs) {
    const { type } = args;

    const end = type === 'states' ? this.children.statesSize : this.children.size;

    for (let i = end - 1; i >= 0; i--) {
      const node = (
        type === 'states' ? this.children.getStateByIndex(i) : this.children.getByIndex(i)
      )?.getIntersection(args);

      if (node) return node;
    }

    return null;
  }

  getIntersection(args: getCapturedNodeArgs): Shape | null {
    const { position, type, exclude, includeChildrenHeight } = args;

    if (exclude?.includes(this.id)) return null;

    if (this.isUnderMouse(position, includeChildrenHeight)) {
      return this;
    }

    const end = type === 'states' ? this.children.statesSize : this.children.size;

    for (let i = end - 1; i >= 0; i--) {
      const node = (
        type === 'states' ? this.children.getStateByIndex(i) : this.children.getByIndex(i)
      )?.getIntersection(args);

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
    let node = this as Shape;
    while (node.parent) {
      depth += 1;
      node = node.parent;
    }

    return depth;
  }
}
