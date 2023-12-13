import { Canvas } from './basic/Canvas';
import { Container } from './basic/Container';
import { Keyboard } from './basic/Keyboard';
import { Mouse } from './basic/Mouse';
import { Render } from './common/Render';
import { EditorManager } from './data/EditorManager';
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
  manager!: EditorManager;

  constructor(container: HTMLDivElement, manager: EditorManager) {
    this.root = container;
    this.canvas = new Canvas(this);
    this.mouse = new Mouse(this.canvas.element);
    this.keyboard = new Keyboard(this.canvas.element);
    this.render = new Render();
    this.root.append(this.canvas.element);
    this.canvas.resize();
    this.mouse.setOffset();

    this.manager = manager;

    this.container = new Container(this);
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

  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
    this.mouse.clearUp();
  }
}
