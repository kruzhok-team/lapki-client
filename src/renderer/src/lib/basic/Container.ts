import { getColor } from '@renderer/theme';
import { Point } from '@renderer/types/graphics';

import { CanvasEditor } from '../CanvasEditor';
import { EventEmitter } from '../common/EventEmitter';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { StateMachine } from '../data/StateMachine';
import { Children } from '../drawable/Children';
import { Node } from '../drawable/Node';
import { picto } from '../drawable/Picto';
import { State } from '../drawable/State';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { clamp } from '../utils';

export const MAX_SCALE = 10;
export const MIN_SCALE = 0.2;

/**
 * Контейнер с машиной состояний, в котором происходит отрисовка,
 * управление камерой, обработка событий и сериализация.
 */
interface ContainerEvents {
  stateDrop: Point;
  contextMenu: Point;
}

export class Container extends EventEmitter<ContainerEvents> {
  app!: CanvasEditor;

  isDirty = true;

  machine!: StateMachine;

  states!: States;
  transitions!: Transitions;

  isPan = false;

  children: Children;
  private mouseDownNode: Node | null = null; // Для оптимизации чтобы на каждый mousemove не искать

  constructor(app: CanvasEditor) {
    super();

    this.app = app;
    this.machine = new StateMachine(this);
    this.states = new States(this);
    this.transitions = new Transitions(this);
    this.children = new Children(this.machine);

    // Порядок важен, система очень тонкая

    this.initEvents();
    this.transitions.initEvents();
    this.machine.loadData();
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawGrid(ctx, canvas);

    const drawChildren = (node: Container | Node) => {
      node.children.forEach((child) => {
        child.draw(ctx, canvas);

        if (!child.children.isEmpty) {
          drawChildren(child);
        }
      });
    };

    drawChildren(this);

    this.transitions.ghost.draw(ctx, canvas);
    this.states.initialStateMark?.draw(ctx);
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
    this.app.canvas.element.addEventListener('dragover', (e) => e.preventDefault());
    this.app.canvas.element.addEventListener('drop', this.handleDrop);

    this.app.keyboard.on('spacedown', this.handleSpaceDown);
    this.app.keyboard.on('spaceup', this.handleSpaceUp);
    this.app.keyboard.on('delete', this.handleDelete);
    this.app.keyboard.on('ctrlz', this.machine.undoRedo.undo);
    this.app.keyboard.on('ctrly', this.machine.undoRedo.redo);
    this.app.keyboard.on('ctrlc', this.handleCopy);
    this.app.keyboard.on('ctrlv', this.handlePaste);
    this.app.keyboard.on('ctrls', this.handleSaveFile);
    this.app.keyboard.on('ctrlshifta', this.handleSaveAsFile);

    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('contextmenu', this.handleMouseContextMenu);
    this.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.app.mouse.on('wheel', this.handleMouseWheel);
  }

  private getCapturedNode(position: Point) {
    const end = this.children.size - 1;

    for (let i = end; i >= 0; i--) {
      const node = this.children.getByIndex(i)?.getIntersection(position);

      if (node) return node;
    }

    return null;
  }

  setScale(value: number) {
    this.app.manager.data.scale = value;

    picto.scale = value;

    this.isDirty = true;
  }

  handleDrop = (e: DragEvent) => {
    e.preventDefault();

    const rect = this.app.canvas.element.getBoundingClientRect();
    const scale = this.app.manager.data.scale;
    const offset = this.app.manager.data.offset;
    const position = {
      x: (e.clientX - rect.left) * scale - offset.x,
      y: (e.clientY - rect.top) * scale - offset.y,
    };

    this.emit('stateDrop', position);
  };

  handleMouseDown = (e: MyMouseEvent) => {
    if (!e.left) return;

    const node = this.getCapturedNode(e);

    if (node) {
      node.handleMouseDown(e);

      const parent = node.parent ?? this;
      const type = node instanceof State ? 'state' : 'transition';
      parent.children.moveToEnd(type, node.id);

      this.mouseDownNode = node;
    } else {
      this.isPan = true;
    }
  };

  handleMouseUp = (e: MyMouseEvent) => {
    const node = this.getCapturedNode(e);

    if (node) {
      node.handleMouseUp(e);
    } else {
      this.transitions.handleMouseUp();
      this.machine.removeSelection();
    }

    this.mouseDownNode = null;

    this.isPan = false;
    this.app.canvas.element.style.cursor = 'default';
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!e.left) return;

    if (this.isPan) {
      // TODO Много раз такие операции повторяются, нужно переделать на функции
      this.app.manager.data.offset.x += e.dx * this.app.manager.data.scale;
      this.app.manager.data.offset.y += e.dy * this.app.manager.data.scale;
    } else if (this.mouseDownNode) {
      this.mouseDownNode.handleMouseMove(e);
    }

    this.app.canvas.element.style.cursor = 'grabbing';
    this.isDirty = true;
  };

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    const node = this.getCapturedNode(e);

    if (node) {
      node.handleMouseDoubleClick(e);
    } else {
      this.emit('stateDrop', this.relativeMousePos({ x: e.x, y: e.y }));
    }
  };

  handleMouseContextMenu = (e: MyMouseEvent) => {
    const node = this.getCapturedNode(e);

    if (node) {
      node.handleMouseContextMenu(e);
    } else {
      this.emit('contextMenu', e);
    }
  };

  handleMouseWheel = (e: MyMouseEvent & { nativeEvent: WheelEvent }) => {
    e.nativeEvent.preventDefault();

    const prevScale = this.app.manager.data.scale;
    const newScale = Number(
      clamp(prevScale + e.nativeEvent.deltaY * 0.001, MIN_SCALE, MAX_SCALE).toFixed(2)
    );
    this.app.manager.data.offset.x -= e.x * prevScale - e.x * newScale;
    this.app.manager.data.offset.y -= e.y * prevScale - e.y * newScale;

    this.setScale(newScale);
  };

  handleDelete = () => {
    this.machine.deleteSelected();
  };

  handleCopy = () => {
    this.machine.copySelected();
  };

  handlePaste = () => {
    this.machine.pasteSelected();
  };

  handleSaveFile = () => {
    this.app.manager.save();
  };

  handleSaveAsFile = () => {
    this.app.manager.saveAs();
  };

  handleSpaceDown = () => {
    this.isPan = true;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleSpaceUp = () => {
    this.isPan = false;

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

    this.machine.states.forEach((state) => {
      arrX.push(state.bounds.x);
      arrY.push(state.bounds.y);
    });

    this.machine.transitions.forEach((transition) => {
      arrX.push(transition.bounds.x);
      arrY.push(transition.bounds.y);
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
