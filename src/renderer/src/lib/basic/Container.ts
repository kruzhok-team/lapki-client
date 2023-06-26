import { Elements } from '@renderer/types/diagram';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { CanvasEditor } from '../CanvasEditor';
import { clamp } from '../utils';

export class Container {
  app!: CanvasEditor;

  states!: States;
  transitions!: Transitions;

  offset = { x: 0, y: 0 };
  scale = 1;

  isPan = false;
  isScale = false;

  private grabOffset = { x: 0, y: 0 };

  constructor(app: CanvasEditor, elements: Elements) {
    this.app = app;

    this.states = new States(this, elements.states);
    this.transitions = new Transitions(this, elements.transitions);

    this.initEvents();
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.states.draw(ctx, canvas);
    this.transitions.draw(ctx, canvas);
  }

  private initEvents() {
    this.app.canvas.element.addEventListener('dragover', this.handleDragOver);
    this.app.canvas.element.addEventListener('drop', this.handleDrop);

    this.app.keyboard.on('spacedown', this.handleSpaceDown);
    this.app.keyboard.on('spaceup', this.handleSpaceUp);
    this.app.keyboard.on('ctrldown', this.handleCtrlDown);
    this.app.keyboard.on('ctrlup', this.handleCtrlUp);

    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('wheel', this.handleMouseWheel);
  }

  handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  handleDrop = (e: DragEvent) => {
    e.preventDefault();

    const rect = this.app.canvas.element.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - this.offset.x,
      y: e.clientY - rect.top - this.offset.y,
    };

    this.states.createNewState(position);

    this.app.isDirty = true;
  };

  handleMouseDown = () => {
    if (!this.isPan || !this.app.mouse.left) return;

    this.grabOffset = {
      x: this.app.mouse.x * this.scale - this.offset.x,
      y: this.app.mouse.y * this.scale - this.offset.y,
    };

    this.app.canvas.element.style.cursor = 'grabbing';
  };

  handleMouseUp = () => {
    if (!this.isPan) return;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleMouseMove = () => {
    if (!this.isPan || !this.app.mouse.left) return;

    this.offset.x = this.app.mouse.x * this.scale - this.grabOffset.x;
    this.offset.y = this.app.mouse.y * this.scale - this.grabOffset.y;

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

  handleMouseWheel = (e: WheelEvent) => {
    if (!this.isScale) return;

    e.preventDefault();

    const newScale = clamp(this.scale + e.deltaY * 0.001, 0.5, 2);
    this.offset.x = this.offset.x - (this.app.mouse.x * this.scale - this.app.mouse.x * newScale);
    this.offset.y = this.offset.y - (this.app.mouse.y * this.scale - this.app.mouse.y * newScale);

    this.scale = newScale;

    this.app.isDirty = true;
  };

  get graphData() {
    return [...this.states.items.values(), ...this.transitions.items.values()];
  }
}
