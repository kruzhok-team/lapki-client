import * as TWEEN from '@tweenjs/tween.js';

import { Canvas, EditorView, Keyboard, Mouse } from '@renderer/lib/basic';
import { Render } from '@renderer/lib/common';
import { EditorController } from '@renderer/lib/data/EditorController';
import { EditorModel } from '@renderer/lib/data/EditorModel';
import { preloadPicto } from '@renderer/lib/drawable';

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
  private _view: EditorView | null = null;
  private _controller: EditorController | null = null;

  model = new EditorModel();
  settings: CanvasEditorSettings = {
    animations: true,
    grid: true,
  };

  constructor() {
    this.model.resetEditor = () => {
      this.controller.loadData();
      this.controller.history.clear();
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
  get view() {
    if (!this._view) {
      throw new Error('Cannot access view before initialization');
    }
    return this._view;
  }
  get controller() {
    if (!this._controller) {
      throw new Error('Cannot access controller before initialization');
    }
    return this._controller;
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

    this._controller = new EditorController(this);
    this._view = new EditorView(this);

    this.canvas.onResize = () => {
      this.mouse.setOffset();
      this.view.isDirty = true;
    };

    preloadPicto(() => {
      this.view.isDirty = true;
    });

    this.render.subscribe(() => {
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

    this.model.data.isMounted = true;
    this.model.triggerDataUpdate('isMounted');

    this.controller.loadData();
    this.view.initEvents();
    this.controller.transitions.initEvents();
  }

  setSettings(settings: CanvasEditorSettings) {
    this.settings = settings;

    if (this.model.data.isMounted) {
      this.view.isDirty = true;
    }
  }

  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
    this.mouse.clearUp();
  }
}
