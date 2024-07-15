import * as TWEEN from '@tweenjs/tween.js';

import { Canvas, Keyboard, Mouse, SchemeView } from '@renderer/lib/basic';
import { Render } from '@renderer/lib/common';
import { preloadPicto } from '@renderer/lib/drawable';

import { ModelController } from './data/ModelController';

interface CanvasScreenSettings {
  animations: boolean;
  grid: boolean;
}

/**
 * Схемотехнический экран.
 */
export class CanvasScheme {
  private _root: HTMLElement | null = null;

  private _canvas: Canvas | null = null;
  private _mouse: Mouse | null = null;
  private _keyboard: Keyboard | null = null;
  private _render: Render | null = null;

  private rendererUnsubscribe: (() => void) | null | false = null;

  view = new SchemeView(this);
  controller!: ModelController;

  setController(controller) {
    this.controller = controller;
  }

  settings: CanvasScreenSettings = {
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

    this.controller.model.data.isMounted = true;
    this.controller.model.triggerDataUpdate('isMounted');

    this.controller.loadData();
    this.view.initEvents();
  }

  setSettings(settings: CanvasScreenSettings) {
    this.settings = settings;

    if (this.controller.model.data.isMounted) {
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

    this.controller.model.data.isMounted = false;
    this.controller.model.triggerDataUpdate('isMounted');
  }

  focus() {
    if (!this._canvas) return;
    this._canvas.element.focus();
  }
}
