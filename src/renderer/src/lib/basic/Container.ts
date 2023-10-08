import { getColor } from '@renderer/theme';
import { Point } from '@renderer/types/graphics';

import { CanvasEditor } from '../CanvasEditor';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { StateMachine } from '../data/StateMachine';
import { picto } from '../drawable/Picto';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { clamp } from '../utils';

export const MAX_SCALE = 10;
export const MIN_SCALE = 0.2;

/**
 * Контейнер с машиной состояний, в котором происходит отрисовка,
 * управление камерой, обработка событий и сериализация.
 */
export class Container {
  app!: CanvasEditor;

  isDirty = true;

  machine!: StateMachine;

  states!: States;
  transitions!: Transitions;

  isPan = false;

  dropCallback?: (position: Point) => void;
  contextMenuOpenCallback?: (position: Point) => void;

  constructor(app: CanvasEditor) {
    this.app = app;
    this.machine = new StateMachine(this);
    this.states = new States(this);
    this.transitions = new Transitions(this);

    // Порядок важен, система очень тонкая

    this.initEvents();
    this.transitions.initEvents();
    this.machine.loadData();
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawGrid(ctx, canvas);
    this.states.draw(ctx, canvas);
    this.transitions.draw(ctx, canvas);
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
<<<<<<< HEAD
    this.app.keyboard.on('ctrlz', this.handleUndo);
    this.app.keyboard.on('ctrln', this.handleNewFile);
    this.app.keyboard.on('ctrlo', this.handleOpenFile);
    this.app.keyboard.on('ctrls', this.handleSaveFile);
    this.app.keyboard.on('ctrlshifta', this.handleSaveAsFile);
    this.app.keyboard.on('ctrle', this.handleImport);
=======
>>>>>>> 1a54cf6afdc365fcd7fdb637d61ab7071f0a2d71

    document.addEventListener('mouseup', this.globalMouseUp);
    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('contextmenu', this.handleFieldContextMenu);
    this.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.app.mouse.on('wheel', this.handleMouseWheel as any);
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

    this.dropCallback?.(position);
  };

  onStateDrop = (callback: (position: Point) => void) => {
    this.dropCallback = callback;
  };

  onFieldContextMenu = (callback: (position: Point) => void) => {
    this.contextMenuOpenCallback = callback;
  };

  handleMouseDown = (e: MyMouseEvent) => {
    this.isPan = true;
    if (!this.isPan || !e.left) return;

    this.app.canvas.element.style.cursor = 'grabbing';
  };

  globalMouseUp = () => {
    this.isPan = false;
    this.app.canvas.element.style.cursor = 'default';
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

<<<<<<< HEAD
  handleUndo = () => {
    this.machine.undo();
  };

  handleNewFile = () => {
    return true;
  };

  handleOpenFile = () => {
    return true;
  };

  handleSaveFile = () => {
    return true;
  };

  handleSaveAsFile = () => {
    return true;
  };

  handleImport = () => {
    return true;
  };

=======
>>>>>>> 1a54cf6afdc365fcd7fdb637d61ab7071f0a2d71
  handleMouseUp = () => {
    this.machine.removeSelection();

    this.globalMouseUp();
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.isPan || !e.left) return;

    // TODO Много раз такие операции повторяются, нужно переделать на функции
    this.app.manager.data.offset.x += e.dx * this.app.manager.data.scale;
    this.app.manager.data.offset.y += e.dy * this.app.manager.data.scale;

    this.isDirty = true;
  };

  handleFieldContextMenu = (e: MyMouseEvent) => {
    this.contextMenuOpenCallback?.(e);
  };

  handleSpaceDown = () => {
    this.isPan = true;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleSpaceUp = () => {
    this.isPan = false;

    this.app.canvas.element.style.cursor = 'default';
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

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    e.stopPropagation();

    this.dropCallback?.(this.relativeMousePos({ x: e.x, y: e.y }));
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
      arrX.push(transition.condition.bounds.x);
      arrY.push(transition.condition.bounds.y);
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
