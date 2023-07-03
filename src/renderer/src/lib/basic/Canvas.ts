export class Canvas {
  element = document.createElement('canvas');
  context = this.element.getContext('2d') as CanvasRenderingContext2D;

  background!: string;

  // Не знаю хорошее ли это решение так регистрировать события, если какие-то ещё появятся то нужно на EventEmitter переделать
  onResize: (() => void) | undefined;

  constructor(background: string) {
    this.background = background;

    window.addEventListener('resize', this.resize);

    this.element.style.position = 'absolute';
  }

  clear() {
    const {
      context,
      background,
      element: { width, height },
    } = this;

    context.beginPath();
    context.rect(0, 0, width, height);
    context.fillStyle = background;
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
    this.element.remove();
  }
}
