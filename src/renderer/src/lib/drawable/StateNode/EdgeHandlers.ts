import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape, icons } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { isPointInRectangle } from '@renderer/lib/utils';

/**
 * «Хваталки» для ноды, надстройка над State, отрисовывающая
 * элементы, позволяющие создать новый переход путём drag-n-drop.
 *
 * @privateRemarks
 * TODO: Возможно эти штуки нужно переделать на обычные dom div?
 */
export class EdgeHandlers {
  app!: CanvasEditor;
  shape!: Shape;

  disabled = true;

  onStartNewTransition?: () => void;

  constructor(app: CanvasEditor, shape: Shape) {
    this.app = app;
    this.shape = shape;
  }

  bindEvents() {
    this.app.mouse.on('mousedown', this.handleMouseDown);
  }

  unbindEvents() {
    this.app.mouse.off('mousedown', this.handleMouseDown);
  }

  get position(): Point[] {
    const offset = 4 / this.app.controller.scale;
    let { x, y, width, height, childrenHeight } = this.shape.drawBounds;

    height += childrenHeight ?? 0;

    return [
      {
        x: x + width / 2 - this.size / 2,
        y: y - this.size - offset,
      },
      {
        x: x + width / 2 - this.size / 2,
        y: y + height + offset,
      },
      {
        x: x - this.size - offset,
        y: y + height / 2 - this.size / 2,
      },
      {
        x: x + width + offset,
        y: y + height / 2 - this.size / 2,
      },
    ];
  }

  get size() {
    return 20 / this.app.controller.scale;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const icon = icons.get('EdgeHandle');
    if (!icon) return;

    ctx.beginPath();

    for (const { x, y } of this.position) {
      ctx.drawImage(icon, x, y, this.size, this.size);
    }

    ctx.fillStyle = '#FFF';
    ctx.fill();

    ctx.closePath();
  }

  handleMouseDown = (e: MyMouseEvent) => {
    if (!this.disabled || !this.isMouseOver(e)) return;

    e.stopPropagation();

    this.onStartNewTransition?.();
  };

  isMouseOver(e: MyMouseEvent) {
    for (const { x, y } of this.position) {
      if (isPointInRectangle({ x, y, width: this.size, height: this.size }, { x: e.x, y: e.y })) {
        return true;
      }
    }

    return false;
  }
}
