import * as TWEEN from '@tweenjs/tween.js';
import throttle from 'lodash.throttle';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { MAX_SCALE, MIN_SCALE } from '@renderer/lib/constants';
import { Children, Picto, Shape } from '@renderer/lib/drawable';
import { Drawable } from '@renderer/lib/types';
import { GetCapturedNodeParams } from '@renderer/lib/types/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { clamp } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';

/**
 * Контейнер с машиной состояний, в котором происходит отрисовка,
 * управление камерой, обработка событий и сериализация.
 */
interface EditorViewEvents {
  dblclick: Point;
  contextMenu: Point;
  showToolTip: { position: Point; text: string };
  closeToolTip: undefined;
  downNode: undefined;
}

export class EditorView extends EventEmitter<EditorViewEvents> implements Drawable {
  isDirty = true;

  children = new Children();
  picto = new Picto();
  private showTooltipTimer: NodeJS.Timeout | undefined = undefined;
  private mouseOnNode: Shape | null = null;
  private mouseDownNode: Shape | null = null; // Для оптимизации чтобы на каждый mousemove не искать

  constructor(public app: CanvasEditor) {
    super();
  }
  lastMousePov: Point = { x: 0, y: 0 };

  initEvents() {
    if (!this.app) return;
    //* Это на будущее
    // this.app.canvas.element.addEventListener('dragover', (e) => e.preventDefault());
    // this.app.canvas.element.addEventListener('drop', this.handleDrop);
    this.app.keyboard.on('spacedown', this.handleSpaceDown);
    this.app.keyboard.on('spaceup', this.handleSpaceUp);
    this.app.keyboard.on('delete', this.app.controller.model.deleteSelected);
    this.app.keyboard.on('ctrlc', this.app.controller.model.copySelected);
    this.app.keyboard.on('ctrlv', this.app.controller.model.pasteSelected);
    this.app.keyboard.on('ctrld', this.app.controller.model.duplicateSelected);
    this.app.mouse.on('mouseout', this.handleMouseUp);
    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.app.mouse.on('wheel', this.handleMouseWheel);
    this.app.mouse.on('rightclick', this.handleRightMouseClick);

    this.on('downNode', this.handleDownNode);
  }

  //! Не забывать удалять слушатели
  removeEvents() {
    this.app.keyboard.off('spacedown', this.handleSpaceDown);
    this.app.keyboard.off('spaceup', this.handleSpaceUp);
    this.app.keyboard.off('delete', this.app.controller.model.deleteSelected);
    this.app.keyboard.off('ctrlc', this.app.controller.model.copySelected);
    this.app.keyboard.off('ctrlv', this.app.controller.model.pasteSelected);
    this.app.keyboard.off('ctrld', this.app.controller.model.duplicateSelected);

    this.app.mouse.off('mouseout', this.handleMouseUp);
    this.app.mouse.off('mousedown', this.handleMouseDown);
    this.app.mouse.off('mouseup', this.handleMouseUp);
    this.app.mouse.off('mousemove', this.handleMouseMove);
    this.app.mouse.off('dblclick', this.handleMouseDoubleClick);
    this.app.mouse.off('wheel', this.handleMouseWheel);
    this.app.mouse.off('rightclick', this.handleRightMouseClick);

    this.off('downNode', this.handleDownNode);
  }

  get isPan() {
    return this.app.keyboard.spacePressed;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (this.app.settings.grid) {
      this.drawGrid(ctx, canvas);
    }

    const drawChildren = (node: Drawable) => {
      if (!node.children) return;

      node.children.forEach((child) => {
        child.draw(ctx, canvas);

        drawChildren(child);
      });
    };

    drawChildren(this);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { width, height } = canvas;

    const scale = this.app.controller.scale;
    const offset = this.app.controller.model.model.data.offset;

    let size = 30;
    const top = (offset.y % size) / scale;
    const left = (offset.x % size) / scale;
    size /= scale;

    ctx.strokeStyle = getColor('grid');
    ctx.lineWidth = 1;

    ctx.beginPath();

    for (let x = left; x < width; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = top; y < height; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();

    ctx.closePath();
  }

  getCapturedNode(args: GetCapturedNodeParams) {
    const { layer, exclude } = args;
    const isExcluded = (node: Shape) => {
      return exclude?.find((value) => value['id'] === node.id);
    };

    if (layer !== undefined) {
      for (let i = this.children.getSize(layer) - 1; i >= 0; i--) {
        const node = (this.children.layers[layer][i] as Shape)?.getIntersection(args);

        if (node && !isExcluded(node)) return node;
      }
    } else {
      for (let i = this.children.layers.length - 1; i >= 0; i--) {
        if (!this.children.layers[i]) continue;

        for (let j = this.children.layers[i].length - 1; j >= 0; j--) {
          const node = (this.children.layers[i][j] as Shape)?.getIntersection?.(args);

          if (node && !isExcluded(node)) return node;
        }
      }
    }

    return null;
  }

  setScale(value: number) {
    this.app.controller.setScale(value);
    this.picto.scale = value;
    this.isDirty = true;
  }

  handleMouseDown = (e: MyMouseEvent) => {
    if (!e.left || this.isPan) return;

    const node = this.getCapturedNode({ position: e });

    if (node) {
      node.handleMouseDown(e);

      const parent = node.parent ?? this;
      parent.children.moveToTopOnLayer(node);

      this.mouseDownNode = node;
      setTimeout(() => this.emit('downNode', undefined), 1000);
    }
  };

  handleMouseUp = (e: MyMouseEvent) => {
    this.app.canvas.element.style.cursor = 'default';
    this.mouseDownNode = null;

    if (!e.left) return;

    if (this.isPan) {
      this.app.canvas.element.style.cursor = 'grab';
      return;
    }

    const node = this.getCapturedNode({ position: e });

    if (node) {
      node.handleMouseUp(e);
    } else {
      this.app.controller.transitions.handleMouseUp();
      this.app.controller.removeSelection();
    }
  };

  handleRightMouseClick = (e: MyMouseEvent) => {
    const node = this.getCapturedNode({ position: e });

    const offset = this.app.mouse.getOffset();

    if (node) {
      return node.handleMouseContextMenu(e);
    }
    this.emit('contextMenu', {
      x: e.x + offset.x,
      y: e.y + offset.y,
    });
  };

  handleMouseMove = (e: MyMouseEvent) => {
    const clear = () => {
      clearTimeout(this.showTooltipTimer);
      setTimeout(() => {
        // this.mouseOnNode?.handleCloseTooltip();
        // this.isDirty = true;
        this.emit('closeToolTip', undefined);
        this.mouseOnNode = null;
      }, 70);
    };

    if (this.showTooltipTimer) {
      clear();
    }

    const checkTooltip = throttle((e: MyMouseEvent) => {
      const node = this.getCapturedNode({ position: e });
      if (!node) {
        clear();
        return;
      }
      if (!e.left && !e.right && node !== this.mouseOnNode) {
        clearTimeout(this.showTooltipTimer);
        this.mouseOnNode = node;
        this.showTooltipTimer = setTimeout(() => {
          const offset = this.app.mouse.getOffset();
          if (node?.tooltipText) {
            this.emit('showToolTip', {
              position: {
                x: this.app.mouse.px + offset.x,
                y: this.app.mouse.py + offset.y,
              },
              text: node.tooltipText,
            });
          }
        }, 400);
      }
    }, 20);

    checkTooltip(e);

    if (e.left) this.handleLeftMouseMove(e);
    if (e.right) this.handleRightMouseMove(e);

    if (e.left || e.right) this.isDirty = true;
  };

  private handleLeftMouseMove(e: MyMouseEvent) {
    if (this.isPan || this.mouseDownNode) {
      this.app.canvas.element.style.cursor = 'grabbing';
    }

    if (this.isPan) {
      // TODO Много раз такие операции повторяются, нужно переделать на функции
      this.app.controller.offset.x += e.dx * this.app.controller.scale;
      this.app.controller.offset.y += e.dy * this.app.controller.scale;
    } else if (this.mouseDownNode) {
      this.mouseDownNode.handleMouseMove(e);
    }
  }

  private handleRightMouseMove(e: MyMouseEvent) {
    this.app.controller.offset.x += e.dx * this.app.controller.scale;
    this.app.controller.offset.y += e.dy * this.app.controller.scale;

    this.app.canvas.element.style.cursor = 'grabbing';
  }

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    const node = this.getCapturedNode({ position: e });

    if (node) {
      node.handleMouseDoubleClick(e);
    } else {
      this.emit('dblclick', this.windowToWorldCoords({ x: e.x, y: e.y }));
    }
  };

  handleMouseWheel = (e: MyMouseEvent & { nativeEvent: WheelEvent }) => {
    e.nativeEvent.preventDefault();

    if (this.app.keyboard.ctrlPressed) {
      this.handleChangeScale(e);
    } else {
      if (this.app.keyboard.shiftPressed) {
        this.app.controller.offset.y -= e.nativeEvent.deltaX * 0.1;
        this.app.controller.offset.x -= e.nativeEvent.deltaY * 0.1;
      } else {
        this.app.controller.offset.y -= e.nativeEvent.deltaY * 0.1;
        this.app.controller.offset.x -= e.nativeEvent.deltaX * 0.1;
      }

      this.isDirty = true;
    }
  };

  private handleChangeScale(e: MyMouseEvent & { nativeEvent: WheelEvent }) {
    const prevScale = this.app.controller.scale;
    const newScale = Number(
      clamp(prevScale + e.nativeEvent.deltaY * 0.001, MIN_SCALE, MAX_SCALE).toFixed(2)
    );
    this.app.controller.offset.x -= e.x * prevScale - e.x * newScale;
    this.app.controller.offset.y -= e.y * prevScale - e.y * newScale;

    this.setScale(newScale);
  }

  handleSpaceDown = () => {
    this.app.canvas.element.style.cursor = 'grab';
  };

  handleSpaceUp = () => {
    this.app.canvas.element.style.cursor = 'default';
  };

  // Window координаты - это координаты мыши на html canvas элементе
  // World координаты - это координаты которые учитывают масштаб и смещение
  windowToWorldCoords(point: Point): Point {
    const scale = this.app.controller.scale;
    const offset = this.app.controller.offset;
    return {
      x: point.x * scale - offset.x,
      y: point.y * scale - offset.y,
    };
  }

  worldToWindowCoords(point: Point): Point {
    const scale = this.app.controller.scale;
    const offset = this.app.controller.offset;
    return {
      x: (point.x + offset.x) / scale,
      y: (point.y + offset.y) / scale,
    };
  }

  viewCentering() {
    const arrX: number[] = [];
    const arrY: number[] = [];

    this.app.controller.states.forEach((state) => {
      arrX.push(state.position.x);
      arrY.push(state.position.y);
    });

    this.app.controller.transitions.forEach((transition) => {
      arrX.push(transition.position.x);
      arrY.push(transition.position.y);
    });

    let minX = Math.min(...arrX);
    let minY = Math.min(...arrY);
    // Если нод нет то минимум координат будет Infinity, в таком случае нужно привести к нулю
    minX = isFinite(minX) ? -minX : 0;
    minY = isFinite(minY) ? -minY : 0;
    // Отступ для красоты
    minX += 40;
    minY += 40;

    this.setScale(1);
    this.app.controller.offset = { x: minX, y: minY };

    this.isDirty = true;
  }

  changeScale(delta: number, replace?: boolean) {
    const x = this.app.canvas.width / 2;
    const y = this.app.canvas.height / 2;

    const prevScale = this.app.controller.scale;
    const newScale = Number(
      clamp(replace ? delta : prevScale + delta, MIN_SCALE, MAX_SCALE).toFixed(2)
    );

    const to = {
      x: this.app.controller.offset.x - (x * prevScale - x * newScale),
      y: this.app.controller.offset.y - (y * prevScale - y * newScale),
      scale: newScale,
    };

    if (this.app.settings.animations) {
      const from = {
        x: this.app.controller.offset.x,
        y: this.app.controller.offset.y,
        scale: prevScale,
      };

      new TWEEN.Tween(from)
        .to(to, 200)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(({ x, y, scale }) => {
          this.app.controller.offset = { x, y };
          this.app.controller.scale = scale;
          this.picto.scale = scale;
          this.isDirty = true;
        })
        .onComplete(({ scale }) => {
          this.setScale(scale);
        })
        .start();
    } else {
      this.app.controller.offset.x = to.x;
      this.app.controller.offset.y = to.y;
      this.setScale(to.scale);
    }
  }

  handleDownNode = () => {
    if (!this.mouseDownNode || !this.mouseDownNode.isDraggable) return;

    // считаем "крайние координаты"
    const leftX = this.mouseDownNode.computedPosition.x;
    const upY = this.mouseDownNode.computedPosition.y;
    const rightX = this.mouseDownNode.computedPosition.x + this.mouseDownNode.computedWidth;
    const downY =
      this.mouseDownNode.computedPosition.y +
      Math.max(this.mouseDownNode.childrenContainerHeight, this.mouseDownNode.computedHeight);

    // граница, определяющая будет ли двигаться канвас или нет
    const border = 20;
    // скорость перемещения холста и перетаскиваемого объекта
    const speed = 2.0;

    const offsetX = this.app.controller.offset.x;
    const offsetY = this.app.controller.offset.y;

    if (leftX <= border) {
      this.app.controller.offset.x += speed * this.app.controller.scale;
    }
    if (upY <= border) {
      this.app.controller.offset.y += speed * this.app.controller.scale;
    }
    if (rightX >= this.app.canvas.width - border) {
      this.app.controller.offset.x -= speed * this.app.controller.scale;
    }
    if (downY >= this.app.canvas.height - border) {
      this.app.controller.offset.y -= speed * this.app.controller.scale;
    }

    const dx = this.app.controller.offset.x - offsetX;
    const dy = this.app.controller.offset.y - offsetY;
    if (dx !== 0 || dy !== 0) {
      this.mouseDownNode.position = {
        x: this.mouseDownNode.position.x - dx * this.app.controller.scale,
        y: this.mouseDownNode.position.y - dy * this.app.controller.scale,
      };

      if (this.mouseDownNode.parent) {
        this.mouseDownNode.position = {
          x: Math.max(0, this.mouseDownNode.position.x),
          y: Math.max(0, this.mouseDownNode.position.y),
        };
      }
      this.isDirty = true;
    }
    setTimeout(() => this.emit('downNode', undefined), 10);
  };
}
