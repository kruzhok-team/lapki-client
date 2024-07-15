import debounce from 'lodash.debounce';

import { EventEmitter } from '@renderer/lib/common';
import { getColor } from '@renderer/theme';

import { CanvasEditor } from '../CanvasEditor';
import { CanvasScheme } from '../CanvasScheme';

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

  constructor(public app: CanvasEditor | CanvasScheme) {
    super();

    window.addEventListener('resize', this.resize);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(app.root);

    this.element.id = 'canvas';
    this.element.tabIndex = -1;
  }

  clear() {
    const {
      context,
      element: { width, height },
    } = this;

    context.beginPath();
    context.rect(0, 0, width, height);
    context.fillStyle = getColor('bg-primary');
    context.fill();
    context.closePath();
  }

  resize: () => void = debounce(() => {
    if (!this.element.parentElement) {
      return;
    }

    this.element.width = this.element.parentElement.offsetWidth;
    this.element.height = this.element.parentElement.offsetHeight;

    this.clear();

    this.emit('resize', undefined);
  }, 10);

  draw(callback: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void) {
    callback(this.context, this.element);
  }

  get width() {
    return this.element.width;
  }

  get height() {
    return this.element.height;
  }

  cleanUp() {
    window.removeEventListener('resize', this.resize);
    this.resizeObserver.unobserve(this.app.root);
    this.reset();
    this.element.remove();
  }
}
