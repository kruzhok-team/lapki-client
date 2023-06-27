import { Elements } from '@renderer/types/diagram';
import { States } from '../drawable/States';
import { Transitions } from '../drawable/Transitions';
import { CanvasEditor } from '../CanvasEditor';

export class Container {
  app!: CanvasEditor;

  states!: States;
  transitions!: Transitions;

  spacePressed = false;

  offset = { x: 0, y: 0 };

  isPan = false;

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
    this.app.canvas.element.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    this.app.canvas.element.addEventListener('drop', (e) => {
      e.preventDefault();

      const rect = this.app.canvas.element.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left - this.offset.x,
        y: e.clientY - rect.top - this.offset.y,
      };

      this.states.createState(position);

      this.app.isDirty = true;
    });

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    this.app.canvas.element.addEventListener('mousemove', this.handleMouseMove);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spacePressed = true;

      if (this.app.mouse.left) {
        this.app.canvas.element.style.cursor = 'grabbing';
      } else {
        this.app.canvas.element.style.cursor = 'grab';
      }
    }
  };

  handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spacePressed = false;

      this.app.canvas.element.style.cursor = 'default';
    }

    if (this.isPan) {
      this.isPan = false;
    }
  };

  handleMouseMove = () => {
    if (!this.spacePressed || !this.app.mouse.left) return;

    this.isPan = true;

    this.offset.x += this.app.mouse.dx;
    this.offset.y += this.app.mouse.dy;

    this.app.isDirty = true;
  };

  cleanEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}
