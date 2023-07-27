import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import { Draggable } from './Draggable';

/**
 * Контекстное меню
 * Здесь описаны свойства и стили для контекстного меню
 */
export class ContextMenu {
  container!: Container;
  draggable!: Draggable;

  constructor(container: Container, draggable: Draggable) {
    this.container = container;
    this.draggable = draggable;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.draggable.drawBounds;

    ctx.beginPath();
    ctx.fillStyle = stateStyle.bodyBg;
    ctx.roundRect(x + 150 / this.container.scale, y + 70 / this.container.scale, 150, 200, [
      stateStyle.bodyBorderRadius,
      stateStyle.bodyBorderRadius,
      this.draggable.children.size !== 0 ? 0 : stateStyle.bodyBorderRadius,
      this.draggable.children.size !== 0 ? 0 : stateStyle.bodyBorderRadius,
    ]);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = transitionStyle.bgColor;
    ctx.fillText('Контекстное меню', x + 160 / this.container.scale, y + 80 / this.container.scale);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = transitionStyle.bgColor;
    ctx.roundRect(
      x + 150 / this.container.scale,
      y + 120 / this.container.scale,
      150 / this.container.scale,
      40 / this.container.scale
    );
    ctx.fill();
    ctx.closePath();
  }
}
