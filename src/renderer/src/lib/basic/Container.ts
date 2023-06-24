import { Elements } from '@renderer/types/diagram';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { CanvasEditor } from '../CanvasEditor';

export class Container {
  app!: CanvasEditor;

  states!: States;
  transitions!: Transitions;

  offset = { x: 0, y: 0 };

  isPan = false;

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

    this.app.keyboard.on('spacedown', this.handleKeyDown);
    this.app.keyboard.on('keyup', this.handleKeyUp);
    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mouseup', this.handleMouseUp);
    this.app.mouse.on('mousemove', this.handleMouseMove);
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
    if (!this.app.keyboard.spacePressed || !this.app.mouse.left) return;

    this.grabOffset = {
      x: this.app.mouse.x - this.offset.x,
      y: this.app.mouse.y - this.offset.y,
    };

    this.app.canvas.element.style.cursor = 'grabbing';
  };

  handleMouseUp = () => {
    if (!this.app.keyboard.spacePressed) return;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return;

    this.isPan = true;

    this.app.canvas.element.style.cursor = 'grab';
  };

  handleKeyUp = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return;

    this.isPan = false;

    this.app.canvas.element.style.cursor = 'default';
  };

  handleMouseMove = () => {
    if (!this.app.keyboard.spacePressed || !this.app.mouse.left) return;

    this.offset.x = this.app.mouse.x - this.grabOffset.x;
    this.offset.y = this.app.mouse.y - this.grabOffset.y;

    this.app.isDirty = true;
  };

  get graphData() {
    return [...this.states.items.values(), ...this.transitions.items.values()];
  }
}
