import debounce from 'lodash.debounce';

import { EventEmitter } from '@renderer/lib/common';
import { getColor } from '@renderer/theme';

import { CanvasEditor } from '../CanvasEditor';

interface CanvasEvents {
  resize: undefined;
}

/**
 * Класс-прослойка для взаимодействия с JS Canvas API.
 * Отвечает за правильное выставление размеров холста (отслеживает изменение размеров
 * окна приложения и родительского блока для автоматических расчётов размеров холста).
 * Также данный класс предоставляет метод draw, с помощью которого можно рисовать
 * на самом холсте.
 */
export class Canvas extends EventEmitter<CanvasEvents> {
  element = document.createElement('canvas');
  context = this.element.getContext('2d') as CanvasRenderingContext2D;

  resizeObserver!: ResizeObserver;
  private logicalWidth = 0;
  private logicalHeight = 0;
  private pixelRatio = 1;
  private resolutionMediaQuery: MediaQueryList | null = null;

  constructor(public app: CanvasEditor) {
    super();

    window.addEventListener('resize', this.resize);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(app.root);

    this.element.id = app.id;
    this.element.tabIndex = -1;
    this.element.style.outline = 'none';

    this.watchPixelRatio();
  }

  clear() {
    const {
      context,
      element: { width, height },
    } = this;

    context.save();
    context.resetTransform();
    context.fillStyle = getColor('bg-canvas');
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  resize = debounce(() => {
    if (!this.element.parentElement) {
      return;
    }

    this.logicalWidth = this.element.parentElement.offsetWidth;
    this.logicalHeight = this.element.parentElement.offsetHeight;
    this.pixelRatio = window.devicePixelRatio || 1;

    this.element.style.width = `${this.logicalWidth}px`;
    this.element.style.height = `${this.logicalHeight}px`;
    this.element.width = Math.round(this.logicalWidth * this.pixelRatio);
    this.element.height = Math.round(this.logicalHeight * this.pixelRatio);

    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.watchPixelRatio();

    this.clear();

    this.emit('resize', undefined);
  }, 10);

  draw(callback: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void) {
    callback(this.context, this.element);
  }

  get width() {
    return this.logicalWidth;
  }

  get height() {
    return this.logicalHeight;
  }

  private handlePixelRatioChange = () => {
    this.resize();
  };

  private watchPixelRatio() {
    if (!window.matchMedia) return;

    this.resolutionMediaQuery?.removeEventListener('change', this.handlePixelRatioChange);
    this.resolutionMediaQuery = window.matchMedia(`(resolution: ${this.pixelRatio}dppx)`);
    this.resolutionMediaQuery.addEventListener('change', this.handlePixelRatioChange);
  }

  cleanUp() {
    window.removeEventListener('resize', this.resize);
    this.resizeObserver.unobserve(this.app.root);
    this.resolutionMediaQuery?.removeEventListener('change', this.handlePixelRatioChange);
    this.resize.cancel();
    this.reset();
    this.element.remove();
  }
}
