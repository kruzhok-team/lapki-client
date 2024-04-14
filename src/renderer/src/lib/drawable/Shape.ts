import { Container } from '@renderer/lib/basic';
import { EventEmitter } from '@renderer/lib/common';
import { CHILDREN_PADDING, LONG_PRESS_TIMEOUT } from '@renderer/lib/constants';
import { Drawable } from '@renderer/lib/types';
import { GetCapturedNodeParams, Layer } from '@renderer/lib/types/drawable';
import { Dimensions, Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { isPointInRectangle } from '@renderer/lib/utils';

import { Children } from './Children';

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

export abstract class Shape extends EventEmitter<ShapeEvents> implements Drawable {
  children = new Children();

  private dragStartPosition: Point | null = null;
  private isMouseDown = false;
  private mouseDownTimerId: ReturnType<typeof setTimeout> | undefined = undefined;

  constructor(protected container: Container, public id: string, public parent?: Shape) {
    super();
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

      x += px + CHILDREN_PADDING;
      y += py + this.parent.dimensions.height + CHILDREN_PADDING;
    }

    return { x, y };
  }

  get computedPosition() {
    const { x, y } = this.compoundPosition;

    return {
      x: (x + this.container.app.model.data.offset.x) / this.container.app.model.data.scale,
      y: (y + this.container.app.model.data.offset.y) / this.container.app.model.data.scale,
    };
  }

  get computedWidth() {
    let width = this.dimensions.width / this.container.app.model.data.scale;
    if (!this.children.isEmpty) {
      const children = [
        ...this.children.getLayer(Layer.States),
        ...this.children.getLayer(Layer.InitialStates),
        ...this.children.getLayer(Layer.Transitions),
      ] as Shape[];

      let rightChildren = children[0] as Shape;

      children.forEach((children) => {
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
          CHILDREN_PADDING / this.container.app.model.data.scale
      );
    }

    return width;
  }

  get computedHeight() {
    return this.dimensions.height / this.container.app.model.data.scale;
  }

  get childrenContainerHeight() {
    if (this.children.isEmpty) return 0;

    const children = [
      ...this.children.getLayer(Layer.States),
      ...this.children.getLayer(Layer.InitialStates),
      ...this.children.getLayer(Layer.Transitions),
    ] as Shape[];

    let bottomChild = children[0] as Shape;
    let result = 0;

    children.forEach((child) => {
      const y = child.position.y;
      const height = child.dimensions.height;
      const childrenContainerHeight = child.childrenContainerHeight;

      const bY = bottomChild.position.y;
      const bHeight = bottomChild.dimensions.height;
      const bChildrenContainerHeight = bottomChild.childrenContainerHeight;

      if (y + height + childrenContainerHeight > bY + bHeight + bChildrenContainerHeight) {
        bottomChild = child;
      }
    });

    result =
      (bottomChild.position.y + bottomChild.dimensions.height + CHILDREN_PADDING * 2) /
        this.container.app.model.data.scale +
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
    }, LONG_PRESS_TIMEOUT);

    this.emit('mousedown', { event: e });

    this.emit('click', { event: e });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.isMouseDown) return;

    if (Math.abs(e.dx) > 1 && Math.abs(e.dy) > 1) {
      clearTimeout(this.mouseDownTimerId);
    }

    this.position = {
      x: this.position.x + e.dx * this.container.app.model.data.scale,
      y: this.position.y + e.dy * this.container.app.model.data.scale,
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

  getCapturedNode(args: GetCapturedNodeParams) {
    // const { type } = args;

    // const end = type === 'states' ? this.children.getSize(0) : this.children.getSize();

    // for (let i = end - 1; i >= 0; i--) {
    //   const node = (
    //     type === 'states' ? this.children.getStateByIndex(i) : this.children.getByIndex(i)
    //   )?.getIntersection(args);

    //   if (node) return node;
    // }

    // return null;

    const { layer } = args;

    if (layer !== undefined) {
      for (let i = this.children.getSize(layer) - 1; i >= 0; i--) {
        const node = (this.children.layers[layer][i] as Shape)?.getIntersection(args);

        if (node) return node;
      }
    } else {
      for (let i = this.children.layers.length - 1; i >= 0; i--) {
        for (let j = this.children.layers[i].length - 1; j >= 0; j--) {
          const node = (this.children.layers[i][j] as Shape)?.getIntersection(args);

          if (node) return node;
        }
      }
    }

    return null;
  }

  getIntersection(args: GetCapturedNodeParams): Shape | null {
    const { position, layer, exclude, includeChildrenHeight } = args;

    if (exclude?.includes(this)) return null;

    if (this.isUnderMouse(position, includeChildrenHeight)) {
      return this;
    }

    if (layer !== undefined) {
      for (let i = this.children.getSize(layer) - 1; i >= 0; i--) {
        const node = (this.children.layers[layer][i] as Shape)?.getIntersection(args);

        if (node) return node;
      }
    } else {
      for (let i = this.children.layers.length - 1; i >= 0; i--) {
        for (let j = this.children.layers[i].length - 1; j >= 0; j--) {
          const node = (this.children.layers[i][j] as Shape)?.getIntersection(args);

          if (node) return node;
        }
      }
    }

    // const end = type === 'states' ? this.children.getSize(0) : this.children.getSize();

    // for (let i = end - 1; i >= 0; i--) {
    //   const node = (
    //     type === 'states' ? this.children.getStateByIndex(i) : this.children.getByIndex(i)
    //   )?.getIntersection(args);

    //   if (node) return node;
    // }

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
