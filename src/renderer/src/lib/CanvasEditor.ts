import { Elements } from '@renderer/types';
import { Canvas } from './basic/Canvas';
import { Mouse } from './basic/Mouse';
import { Render } from './common/Render';
import { States } from './drawable/States';
import { Transitions } from './drawable/Transitions';

export class CanvasEditor {
  root!: HTMLElement;
  canvas!: Canvas;
  mouse!: Mouse;
  render!: Render;

  states!: States;
  transitions!: Transitions;

  isDirty = true;

  constructor(container: HTMLDivElement, elements: Elements) {
    this.root = container;
    this.canvas = new Canvas('rgb(38, 38, 38)');
    this.mouse = new Mouse(this.canvas.element);
    this.render = new Render();

    this.root.append(this.canvas.element);
    this.canvas.resize();

    this.states = new States(this, elements.states);
    this.transitions = new Transitions(this, elements.transitions);

    this.render.subscribe(() => {
      if (!this.isDirty) return;

      this.mouse.tick();

      this.canvas.clear();

      this.canvas.draw((ctx, canvas) => {
        this.states.draw(ctx, canvas);
        this.transitions.draw(ctx, canvas);
      });

      this.isDirty = false;
    });
  }
}
