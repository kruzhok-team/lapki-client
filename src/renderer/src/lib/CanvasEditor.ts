import * as TWEEN from '@tweenjs/tween.js';

import { Canvas, EditorView, Keyboard, Mouse } from '@renderer/lib/basic';
import { Render } from '@renderer/lib/common';
import { preloadPicto } from '@renderer/lib/drawable';

import { CanvasController } from './data/ModelController/CanvasController';

interface CanvasEditorSettings {
  animations: boolean;
  grid: boolean;
}

/**
 * Редактор машин состояний.
 */
export class CanvasEditor {
  private _root: HTMLElement | null = null;

  private _canvas: Canvas | null = null;
  private _mouse: Mouse | null = null;
  private _keyboard: Keyboard | null = null;
  private _render: Render | null = null;

  private rendererUnsubscribe: (() => void) | null | false = null;

  id: string;
  view: EditorView;
  constructor(id: string) {
    this.view = new EditorView(this);
    this.id = id;
  }

  controller!: CanvasController;

  setController(controller: CanvasController) {
    this.controller = controller;
  }

  settings: CanvasEditorSettings = {
    animations: true,
    grid: true,
  };

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

  mount(root: HTMLDivElement) {
    this._root = root;
    this._canvas = new Canvas(this);
    this._mouse = new Mouse(this.canvas.element);
    this._keyboard = new Keyboard(this.canvas.element);
    this._render = new Render();
    this._root.append(this.canvas.element);
    this.canvas.resize();
    this.mouse.setOffset();

    this.canvas.on('resize', () => {
      this.mouse.setOffset();
      this.view.isDirty = true;
    });

    preloadPicto(() => {
      this.view.isDirty = true;
    });

    this.rendererUnsubscribe = this.render.subscribe(() => {
      if (this.settings.animations) {
        TWEEN.update();
      }

      if (!this.view.isDirty) return;
      this.mouse.tick();
      this.canvas.clear();
      this.canvas.draw((ctx, canvas) => {
        this.view.draw(ctx, canvas);
      });
      this.view.isDirty = false;
    });

    this.controller.emit('isMounted', {
      canvasId: this.controller.id,
      status: true,
    });

    this.controller.loadData();
    this.view.initEvents();
    this.controller.transitions.initEvents();
    this.controller.initializer.init();
    this.controller.init();
  }

  setSettings(settings: CanvasEditorSettings) {
    this.settings = settings;

    if (this.controller.isMounted) {
      this.view.isDirty = true;
    }
  }

  unmount() {
    this.view.removeEvents();

    this.canvas.cleanUp();
    this.keyboard.cleanUp();
    this.mouse.clearUp();

    if (typeof this.rendererUnsubscribe === 'function') {
      this.rendererUnsubscribe();
    }

    this._root = null;
    this._canvas = null;
    this._mouse = null;
    this._keyboard = null;
    this._render = null;

    this.controller.isMounted = false;
    this.controller.needToRewatchEdgeHandlers = true;
    this.controller.emit('isMounted', {
      canvasId: this.controller.id,
      status: false,
    });
  }

  focus() {
    if (!this._canvas) return;
    this._canvas.element.focus();
  }
}
