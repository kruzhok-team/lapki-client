import { Elements } from '@renderer/types';
import { Canvas } from './basic/Canvas';
import { Mouse } from './basic/Mouse';
import { Render } from './common/Render';
import { Transition } from './drawable/Transition';
import { StatesGroup } from './drawable/StatesGroup';

export class CanvasEditor {
  root!: HTMLElement;
  canvas!: Canvas;
  mouse!: Mouse;
  render!: Render;

  statesGroup!: StatesGroup;
  transitions: Map<string, Transition> = new Map();

  selectedStateId: null | string = null;

  isDirty = true;

  constructor(container: HTMLDivElement, elements: Elements) {
    this.root = container;
    this.canvas = new Canvas('rgb(38, 38, 38)');
    this.mouse = new Mouse(this.canvas.element);
    this.render = new Render();

    this.root.append(this.canvas.element);
    this.canvas.resize();

    this.statesGroup = new StatesGroup(this, elements.states);

    for (const id in elements.transitions) {
      const transition = new Transition({ app: this, ...elements.transitions[id] });

      this.transitions.set(id, transition);
    }

    this.render.subscribe((data) => {
      if (!this.isDirty) return;

      this.mouse.tick();

      this.canvas.clear();

      this.canvas.draw((ctx, canvas) => {
        this.statesGroup.draw(ctx, canvas);

        this.transitions.forEach((transition) => {
          transition.draw(ctx, canvas);
        });

        // this.container.group.draw(ctx, canvas);
        // this.selector.draw(ctx, canvas);
      });

      this.isDirty = false;
    });
  }
}
