import { getColor } from '@renderer/theme';
import { Elements } from '@renderer/types/diagram';
import { Point } from '@renderer/types/graphics';

import { CanvasEditor } from '../CanvasEditor';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { StateMachine } from '../data/StateMachine';
import { picto } from '../drawable/Picto';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { clamp } from '../utils';

/**
 * Контейнер с машиной состояний, в котором происходит отрисовка,
 * управление камерой, обработка событий и сериализация.
 */
export class Container {
  [x: string]: any;
  app!: CanvasEditor;

  isDirty = true;

  machine!: StateMachine;

  states!: States;
  transitions!: Transitions;

  offset = { x: 0, y: 0 };
  scale = 1;

  isPan = false;

  dropCallback?: (position: Point) => void;
  contextMenuOpenCallback?: (position: Point) => void;

  constructor(app: CanvasEditor, elements: Elements) {
    this.app = app;
    this.machine = new StateMachine(this);
    this.states = new States(this);
    this.transitions = new Transitions(this);

    // Порядок важен, система очень тонкая

    this.initEvents();
    this.transitions.initEvents();
    this.machine.loadData(elements);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.drawGrid(ctx, canvas);
    this.states.draw(ctx, canvas);
    this.transitions.draw(ctx, canvas);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { width, height } = canvas;

    let size = 30;
    const top = (this.offset.y % size) / this.scale;
    const left = (this.offset.x % size) / this.scale;
    size /= this.scale;

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
    this.app.keyboard.on('ctrlz', this.handleUndo);

    document.addEventListener('mouseup', this.globalMouseUp);
    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('contextmenu', this.handleFieldContextMenu);
    this.app.mouse.on('dblclick', this.handleMouseDoubleClick);
    this.app.mouse.on('wheel', this.handleMouseWheel as any);
  }

  handleDrop = (e: DragEvent) => {
    e.preventDefault();

    const rect = this.app.canvas.element.getBoundingClientRect();
    const position = {
      x: (e.clientX - rect.left) * this.scale - this.offset.x,
      y: (e.clientY - rect.top) * this.scale - this.offset.y,
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

  handleUndo = () => {
    this.machine.undo();
  };

  handleMouseUp = () => {
    this.machine.removeSelection();

    this.globalMouseUp();
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.isPan || !e.left) return;

    // TODO Много раз такие операции повторяются, нужно переделать на функции
    this.offset.x += e.dx * this.scale;
    this.offset.y += e.dy * this.scale;

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

    const newScale = clamp(this.scale + e.nativeEvent.deltaY * 0.001, 0.5, 2);
    this.offset.x -= e.x * this.scale - e.x * newScale;
    this.offset.y -= e.y * this.scale - e.y * newScale;

    this.scale = newScale;
    picto.scale = newScale;

    this.isDirty = true;
  };

  handleMouseDoubleClick = (e: MyMouseEvent) => {
    e.stopPropagation();

    this.dropCallback?.(this.relativeMousePos({ x: e.x, y: e.y }));
  };

  relativeMousePos(e: Point): Point {
    // const rect = this.app.canvas.element.getBoundingClientRect();
    return {
      x: e.x * this.scale - this.offset.x,
      y: e.y * this.scale - this.offset.y,
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

    this.scale = 1;
    this.offset = { x: -Math.min(...arrX), y: -Math.min(...arrY) };

    this.isDirty = true;
  }

  get graphData() {
    return this.machine.graphData();
  }
}
