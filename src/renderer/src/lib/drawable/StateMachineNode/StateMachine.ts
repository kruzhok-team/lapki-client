import { CanvasScheme } from '@renderer/lib/CanvasScheme';
import { Shape } from '@renderer/lib/drawable/Shape';
import { getColor } from '@renderer/theme';

import { MarkedIconData, picto } from '../Picto';

const fontSizeMark = 32;
/**
 * Представление машины состояний на схемотехническом экране
 */
export class DrawableStateMachine extends Shape {
  isSelected = false;
  icon: MarkedIconData;
  constructor(app: CanvasScheme, id: string, icon: MarkedIconData, parent?: Shape) {
    super(app, id, parent);
    this.icon = icon;
  }

  get computedStyles() {
    const scale = this.app.controller.model.data.scale;

    return {
      padding: 10 / scale,
      fontSize: 16 / scale,
      borderRadius: 6 / scale,
      color: getColor('border-primary'),
    };
  }

  // get data() {
  //   return this.app.controller.model.data.elements.components[this.id];
  // }

  get position() {
    return {
      x: 0,
      y: 0,
    };
  }
  set position(value) {
    this.position = value;
  }

  get dimensions() {
    return { width: 150, height: 100 };
  }
  set dimensions(_value) {
    throw new Error('Components does not have dimensions');
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
    if (!this.children.isEmpty) {
      this.drawChildrenBorder(ctx);
    }
  }

  private drawChildrenBorder(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + height, width - 2, childrenHeight, [
      0,
      0,
      6 / this.app.controller.model.data.scale,
      6 / this.app.controller.model.data.scale,
    ]);
    ctx.stroke();

    ctx.closePath();
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform;
    if (!platform || !this.icon) return;

    const { x, y, width, height } = this.drawBounds;
    picto.drawRect(ctx, x, y, width, height, undefined, undefined, 50);
    // picto.drawImage(
    //   ctx,
    //   this.icon,
    //   {
    //     x: x,
    //     y: y,
    //     width: width,
    //     height: height,
    //   },
    //   fontSizeMark
    // );
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const { borderRadius } = this.computedStyles;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
