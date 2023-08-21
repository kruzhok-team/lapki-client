import { Elements, emptyElements } from '@renderer/types/diagram';

import { Canvas } from './basic/Canvas';
import { Container } from './basic/Container';
import { Keyboard } from './basic/Keyboard';
import { Mouse } from './basic/Mouse';
import { Render } from './common/Render';
import { preloadPicto } from './drawable/Picto';
import { DataUpdateCallback } from './data/StateMachine';

/**
 * Редактор машин состояний.
 */
export class CanvasEditor {
  root!: HTMLElement;
  canvas!: Canvas;
  mouse!: Mouse;
  keyboard!: Keyboard;
  render!: Render;

  container!: Container;

  constructor(container: HTMLDivElement, elements?: Elements) {
    this.root = container;
    this.canvas = new Canvas(this, 'rgb(38, 38, 38)');
    this.mouse = new Mouse(this.canvas.element);
    this.keyboard = new Keyboard();
    this.render = new Render();
    this.root.append(this.canvas.element);
    this.canvas.resize();
    this.mouse.setOffset();

    const contElements = typeof elements !== 'undefined' ? elements : emptyElements();
    this.container = new Container(this, contElements);
    this.canvas.onResize = () => {
      this.mouse.setOffset();
      this.container.isDirty = true;
    };

    preloadPicto(() => {
      this.container.isDirty = true;
    });

    this.render.subscribe(() => {
      if (!this.container.isDirty) return;
      this.mouse.tick();
      this.canvas.clear();
      this.canvas.draw((ctx, canvas) => {
        this.container.draw(ctx, canvas);
      });
      this.container.isDirty = false;
    });
  }

  loadData(elements: Elements) {
    this.container.machine.clear();
    this.container.machine.loadData(elements);
    this.container.isDirty = true;
    console.log("loaded!")
  }

  getData(): string {
    return JSON.stringify(this.container.machine.graphData(), null, 2);
  }

  onDataUpdate(fn: DataUpdateCallback) {
    this.container.machine.onDataUpdate(fn);
  }

  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
    this.container.machine.onDataUpdate(undefined);
  }
}
