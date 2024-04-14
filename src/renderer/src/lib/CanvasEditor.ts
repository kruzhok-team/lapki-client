import { Canvas, EditorView, Keyboard, Mouse } from '@renderer/lib/basic';
import { Render } from '@renderer/lib/common';
import { preloadPicto } from '@renderer/lib/drawable';

import { EditorModel } from './data/EditorModel';

/**
 * Редактор машин состояний.
 */
export class CanvasEditor {
  private _root: HTMLElement | null = null;

  private _canvas: Canvas | null = null;
  private _mouse: Mouse | null = null;
  private _keyboard: Keyboard | null = null;
  private _render: Render | null = null;
  private _container: EditorView | null = null;

  model!: EditorModel;

  constructor() {
    this.model = new EditorModel();
    this.model.resetEditor = () => {
      this.editorView.editorController.loadData();
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
  get editorView() {
    if (!this._container) {
      throw new Error('Cannot access editorView before initialization');
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

    this._container = new EditorView(this);
    this.canvas.onResize = () => {
      this.mouse.setOffset();
      this.editorView.isDirty = true;
    };

    preloadPicto(() => {
      this.editorView.isDirty = true;
    });

    this.render.subscribe(() => {
      if (!this.editorView.isDirty) return;
      this.mouse.tick();
      this.canvas.clear();
      this.canvas.draw((ctx, canvas) => {
        this.editorView.draw(ctx, canvas);
      });
      this.editorView.isDirty = false;
    });

    this.model.data.isMounted = true;
    this.model.triggerDataUpdate('isMounted');

    this.editorView.editorController.loadData();
  }

  cleanUp() {
    this.canvas.cleanUp();
    this.keyboard.cleanUp();
    this.mouse.clearUp();
  }
}
