import { CanvasEditor } from '../CanvasEditor';
import { getColor } from '@renderer/theme';

/**
 * Класс-прослойка для взаимодействия с JS Canvas API.
 * Отвечает за правильное выставление размеров холста (отслеживает изменение размеров
 * окна приложения и родительского блока для автоматических расчётов размеров холста).
 * Также данный класс предоставляет метод draw, с помощью которого можно рисовать
 * на самом холсте.
 */
export class Canvas {
  app!: CanvasEditor;

  element = document.createElement('canvas');
  context = this.element.getContext('2d') as CanvasRenderingContext2D;

  resizeObserver!: ResizeObserver;

  // Не знаю хорошее ли это решение так регистрировать события, если какие-то ещё появятся то нужно на EventEmitter переделать
  onResize: (() => void) | undefined;
  toDataURL: any;

  constructor(app: CanvasEditor) {
    this.app = app;

    window.addEventListener('resize', this.resize);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(app.root);

    this.element.style.position = 'absolute';
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

  resize = () => {
    if (!this.element.parentElement) {
      return;
    }

    this.element.width = this.element.parentElement.offsetWidth;
    this.element.height = this.element.parentElement.offsetHeight;

    this.clear();

    this.onResize?.();
  };

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
    this.element.remove();
  }
}
