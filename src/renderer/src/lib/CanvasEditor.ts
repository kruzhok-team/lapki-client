import { Elements, emptyElements } from '@renderer/types/diagram';
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

  constructor(container: HTMLDivElement, elements?: Elements) {
    preloadPicto(() => {
      this.container.isDirty = true;
    });

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

  get filename(): string | null | undefined {
    return this.container.machine.filename;
  }

  set filename(name: string | null | undefined) {
    this.container.machine.filename = name;
  }
  
  loadData(elements: Elements, filename: string | null) {
    // со всем разнообразием обрабатываемых событий пока что
    // проще создать контейнер заново
    
    // предварительно сбрасываем все обработчики
    this.mouse.reset();
    this.keyboard.reset();
    
    this.container = new Container(this, elements);
    this.container.machine.filename = filename;
    this.container.isDirty = true;
  }

  getData(): string {
    return JSON.stringify(this.container.machine.graphData());
  }

  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
  }
}
