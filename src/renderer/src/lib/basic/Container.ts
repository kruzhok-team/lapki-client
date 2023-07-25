import { Elements } from '@renderer/types/diagram';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { CanvasEditor } from '../CanvasEditor';
import { clamp } from '../utils';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { Point } from '@renderer/types/graphics';

/**
 * Контейнер с машиной состояний, в котором происходит отрисовка,
 * управление камерой, обработка событий и сериализация.
 */
export class Container {
  [x: string]: any;
  app!: CanvasEditor;

  states!: States;
  transitions!: Transitions;

  offset = { x: 0, y: 0 };
  scale = 1;

  isPan = false;
  isScale = false;

  dropCallback?: (position: Point) => void;

  constructor(app: CanvasEditor, elements: Elements) {
    this.app = app;
    this.states = new States(this);
    this.transitions = new Transitions(this);

    // Порядок важен, система очень тонкая

    this.initEvents();
    this.states.initEvents();
    this.transitions.initEvents();
    this.states.initItems(elements.states, elements.initialState);
    this.transitions.initItems(elements.transitions);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.states.draw(ctx, canvas);
    this.transitions.draw(ctx, canvas);
  }

  private initEvents() {
    this.app.canvas.element.addEventListener('dragover', (e) => e.preventDefault());
    this.app.canvas.element.addEventListener('drop', this.handleDrop);

    this.app.keyboard.on('spacedown', this.handleSpaceDown);
    this.app.keyboard.on('spaceup', this.handleSpaceUp);
    this.app.keyboard.on('ctrldown', this.handleCtrlDown);
    this.app.keyboard.on('ctrlup', this.handleCtrlUp);

    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('wheel', this.handleMouseWheel as any);
  }

  // handleDragOver = (e: DragEvent) => {
  //   e.preventDefault();


  // };

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

  handleMouseDown = (e: MyMouseEvent) => {
    if (!this.isPan || !e.left) return;

    this.app.canvas.element.style.cursor = 'grabbing';
  };

  handleMouseUp = () => {
    if (!this.isPan) return;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleMouseMove = (e: MyMouseEvent) => {
    if (!this.isPan || !e.left) return;

    // TODO Много раз такие операции повторяются, нужно переделать на функции
    this.offset.x += e.dx * this.scale;
    this.offset.y += e.dy * this.scale;

    this.app.isDirty = true;
  };

  handleSpaceDown = () => {
    this.isPan = true;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleSpaceUp = () => {
    this.isPan = false;

    this.app.canvas.element.style.cursor = 'default';
  };

  handleCtrlDown = () => {
    this.isScale = true;
  };

  handleCtrlUp = () => {
    this.isScale = false;
  };

  handleMouseWheel = (e: MyMouseEvent & { nativeEvent: WheelEvent }) => {
    if (!this.isScale) return;
    e.nativeEvent.preventDefault();

    const newScale = clamp(this.scale + e.nativeEvent.deltaY * 0.001, 0.5, 2);
    this.offset.x -= e.x * this.scale - e.x * newScale;
    this.offset.y -= e.y * this.scale - e.y * newScale;

    this.scale = newScale;

    this.app.isDirty = true;
  };

  get graphData() {
    return {
      states: { ...Object.fromEntries(this.states.items) },
      initialState: 'on',
      transitions: [...this.transitions.items.values()],
    };
  }
}
