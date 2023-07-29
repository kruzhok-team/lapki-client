import { Elements } from '@renderer/types/diagram';
import { Canvas } from './basic/Canvas';
import { Mouse } from './basic/Mouse';
import { Render } from './common/Render';
import { Container } from './basic/Container';
import { Keyboard } from './basic/Keyboard';
import { preloadPicto } from './drawable/Picto';

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

  constructor(container: HTMLDivElement, elements: Elements) {
    preloadPicto(() => {this.container.isDirty = true;});
    
    this.root = container;
    this.canvas = new Canvas(this, 'rgb(38, 38, 38)');
    this.mouse = new Mouse(this.canvas.element);
    this.keyboard = new Keyboard();
    this.render = new Render();
    this.root.append(this.canvas.element);
    this.canvas.resize();
    this.mouse.setOffset();

    this.container = new Container(this, elements);
    this.canvas.onResize = () => {
      this.mouse.setOffset();
      this.container.isDirty = true;
    };

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
  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
  }
}
