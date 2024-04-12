import { Canvas, Container, Keyboard, Mouse } from '@renderer/lib/basic';
import { Render } from '@renderer/lib/common';
import { preloadPicto } from '@renderer/lib/drawable';

import { EditorManager } from './data/EditorManager';

/**
 * Редактор машин состояний.
 */
export class CanvasEditor {
  private _root: HTMLElement | null = null;

  private _canvas: Canvas | null = null;
  private _mouse: Mouse | null = null;
  private _keyboard: Keyboard | null = null;
  private _render: Render | null = null;
  private _container: Container | null = null;

  manager!: EditorManager;

  constructor() {
    this.manager = new EditorManager();
    this.manager.resetEditor = () => {
      this.container.machineController.loadData();
    };
  }

  // геттеры для удобства, чтобы после монтирования редактора можно было бы ими нормально пользоваться а до монтирования ошибки
  get root() {
    if (!this._root) {
      throw new Error('Cannot access root before initialization');
    }
    return this._root;
  }
  get canvas() {
    if (!this._canvas) {
      throw new Error('Cannot access canvas before initialization');
    }
    return this._canvas;
  }
  get mouse() {
    if (!this._mouse) {
      throw new Error('Cannot access mouse before initialization');
    }
    return this._mouse;
  }
  get keyboard() {
    if (!this._keyboard) {
      throw new Error('Cannot access keyboard before initialization');
    }
    return this._keyboard;
  }
  get render() {
    if (!this._render) {
      throw new Error('Cannot access render before initialization');
    }
    return this._render;
  }
  get container() {
    if (!this._container) {
      throw new Error('Cannot access container before initialization');
    }
    return this._container;
  }

  mount(root: HTMLDivElement) {
    this._root = root;
    this._canvas = new Canvas(this);
    this._mouse = new Mouse(this.canvas.element);
    this._keyboard = new Keyboard(this.canvas.element);
    this._render = new Render();
    this._root.append(this.canvas.element);
    this.canvas.resize();
    this.mouse.setOffset();

    this._container = new Container(this);
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

    this.manager.data.isMounted = true;
    this.manager.triggerDataUpdate('isMounted');

    this.container.machineController.loadData();
  }

  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
    this.mouse.clearUp();
  }
}
