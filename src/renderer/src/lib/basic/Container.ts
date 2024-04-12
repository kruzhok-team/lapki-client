import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { History } from '@renderer/lib/data/History';
import { MachineController } from '@renderer/lib/data/MachineController';
import { Children, picto, Shape } from '@renderer/lib/drawable';
import { Drawable } from '@renderer/lib/types';
import { GetCapturedNodeParams } from '@renderer/lib/types/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { clamp } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';
import { MyMouseEvent } from '@renderer/types/mouse';

export const MAX_SCALE = 10;
export const MIN_SCALE = 0.2;

/**
 * Контейнер с машиной состояний, в котором происходит отрисовка,
 * управление камерой, обработка событий и сериализация.
 */
interface ContainerEvents {
  dblclick: Point;
  contextMenu: Point;
}

export class Container extends EventEmitter<ContainerEvents> implements Drawable {
  isDirty = true;

  machineController!: MachineController;

  history = new History(this);
  children = new Children();

  private mouseDownNode: Shape | null = null; // Для оптимизации чтобы на каждый mousemove не искать

  constructor(public app: CanvasEditor) {
    super();

    this.machineController = new MachineController(this, this.history);

    // Порядок важен, система очень тонкая

    this.initEvents();
    this.machineController.transitions.initEvents();
    this.machineController.loadData();
  }

  get isPan() {
    return this.app.keyboard.spacePressed;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawGrid(ctx, canvas);

    const drawChildren = (node: Drawable) => {
      if (!node.children) return;

      node.children.forEach((child) => {
        child.draw(ctx, canvas);

        drawChildren(child);
      });
    };

    drawChildren(this);

    this.machineController.transitions.ghost.draw(ctx, canvas);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { width, height } = canvas;

    const scale = this.app.manager.data.scale;
    const offset = this.app.manager.data.offset;

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

  private initEvents() {
    // ! Это на будущее
    // this.app.canvas.element.addEventListener('dragover', (e) => e.preventDefault());
    // this.app.canvas.element.addEventListener('drop', this.handleDrop);

    this.app.keyboard.on('spacedown', this.handleSpaceDown);
    this.app.keyboard.on('spaceup', this.handleSpaceUp);
    this.app.keyboard.on('delete', this.machineController.deleteSelected);
    this.app.keyboard.on('ctrlz', this.history.undo);
    this.app.keyboard.on('ctrly', this.history.redo);
    this.app.keyboard.on('ctrlc', this.machineController.copySelected);
    this.app.keyboard.on('ctrlv', this.machineController.pasteSelected);
    this.app.keyboard.on('ctrls', this.app.manager.files.save);
    this.app.keyboard.on('ctrlshifta', this.app.manager.files.saveAs);

    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.app.mouse.on('wheel', this.handleMouseWheel);
    this.app.mouse.on('rightclick', this.handleRightMouseClick);
  }

  getCapturedNode(args: GetCapturedNodeParams) {
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

  setScale(value: number) {
    this.app.manager.setScale(value);
    picto.scale = value;

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
      this.machineController.transitions.handleMouseUp();
      this.machineController.removeSelection();
    }
  };

  handleRightMouseClick = (e: MyMouseEvent) => {
    const node = this.getCapturedNode({ position: e });

    const offset = this.app.mouse.getOffset();

    //Крайняя необходимость, по-другому пока не стал делать, хотя есть способ как можно это сделать, но сколько займёт реализация не могу знать
    const position = {
      x: e.x + offset.x,
      y: e.y + offset.y,
      dx: e.dx,
      dy: e.dy,
      /**
       * Наличие зажатой левой кнопки.
       * Полезно для отслеживания перетаскивания.
       */
      left: e.left,
      button: e.button,
      stopPropagation: e.stopPropagation,
      nativeEvent: e.nativeEvent,
    };
    if (node) {
      node.handleMouseContextMenu(e);
    } else {
      this.emit('contextMenu', position);
    }
  };

  handleMouseMove = (e: MyMouseEvent) => {
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
      this.app.manager.data.offset.x += e.dx * this.app.manager.data.scale;
      this.app.manager.data.offset.y += e.dy * this.app.manager.data.scale;
    } else if (this.mouseDownNode) {
      this.mouseDownNode.handleMouseMove(e);
    }
  }

  private handleRightMouseMove(e: MyMouseEvent) {
    this.app.manager.data.offset.x += e.dx * this.app.manager.data.scale;
    this.app.manager.data.offset.y += e.dy * this.app.manager.data.scale;

    this.app.canvas.element.style.cursor = 'grabbing';
  }

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    const node = this.getCapturedNode({ position: e });

    if (node) {
      node.handleMouseDoubleClick(e);
    } else {
      this.emit('dblclick', this.relativeMousePos({ x: e.x, y: e.y }));
    }
  };

  handleMouseWheel = (e: MyMouseEvent & { nativeEvent: WheelEvent }) => {
    e.nativeEvent.preventDefault();

    if (this.app.keyboard.ctrlPressed) {
      this.handleChangeScale(e);
    } else {
      if (this.app.keyboard.shiftPressed) {
        this.app.manager.data.offset.y -= e.nativeEvent.deltaX * 0.1;
        this.app.manager.data.offset.x -= e.nativeEvent.deltaY * 0.1;
      } else {
        this.app.manager.data.offset.y -= e.nativeEvent.deltaY * 0.1;
        this.app.manager.data.offset.x -= e.nativeEvent.deltaX * 0.1;
      }

      this.isDirty = true;
    }
  };

  private handleChangeScale(e: MyMouseEvent & { nativeEvent: WheelEvent }) {
    const prevScale = this.app.manager.data.scale;
    const newScale = Number(
      clamp(prevScale + e.nativeEvent.deltaY * 0.001, MIN_SCALE, MAX_SCALE).toFixed(2)
    );
    this.app.manager.data.offset.x -= e.x * prevScale - e.x * newScale;
    this.app.manager.data.offset.y -= e.y * prevScale - e.y * newScale;

    this.setScale(newScale);
  }

  handleSpaceDown = () => {
    this.app.canvas.element.style.cursor = 'grab';
  };

  handleSpaceUp = () => {
    this.app.canvas.element.style.cursor = 'default';
  };

  relativeMousePos(e: Point): Point {
    // const rect = this.app.canvas.element.getBoundingClientRect();
    const scale = this.app.manager.data.scale;
    const offset = this.app.manager.data.offset;
    return {
      x: e.x * scale - offset.x,
      y: e.y * scale - offset.y,
    };
  }

  viewCentering() {
    const arrX: number[] = [];
    const arrY: number[] = [];

    this.machineController.states.forEach((state) => {
      arrX.push(state.position.x);
      arrY.push(state.position.y);
    });

    this.machineController.transitions.forEach((transition) => {
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
    this.app.manager.data.offset = { x: minX, y: minY };

    this.isDirty = true;
  }

  changeScale(delta: number, replace?: boolean) {
    const x = this.app.canvas.width / 2;
    const y = this.app.canvas.height / 2;

    const prevScale = this.app.manager.data.scale;
    const newScale = Number(
      clamp(replace ? delta : prevScale + delta, MIN_SCALE, MAX_SCALE).toFixed(2)
    );
    this.app.manager.data.offset.x -= x * prevScale - x * newScale;
    this.app.manager.data.offset.y -= y * prevScale - y * newScale;

    this.setScale(newScale);
  }
}
