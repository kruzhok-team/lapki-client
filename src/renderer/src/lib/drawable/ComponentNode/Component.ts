import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import { Dimensions, Point } from '@renderer/lib/types';
import { getColor } from '@renderer/theme';

import { MarkedIconData, picto } from '../Picto';

const fontSizeMark = 32;
/**
 * Представление компонента в схемотехническом экране
 */
export class DrawableComponent extends Shape {
  isSelected = false;
  dimensions: Dimensions;
  constructor(
    app: CanvasEditor,
    id: string,
    public smId: string,
    public position: Point,
    public icon: MarkedIconData,
    parent?: Shape
  ) {
    super(app, id, parent);
    this.smId = smId;
    this.icon = icon;
    this.position = position;
    this.dimensions = {
      width: 90,
      height: 50,
    };
  }

  get computedStyles() {
    const scale = this.app.controller.scale;

    return {
      padding: 10 / scale,
      fontSize: 16 / scale,
      borderRadius: 6 / scale,
      color: getColor('border-primary'),
    };
  }

  // TODO (L140-beep): заглушка
  get data() {
    return {
      position: {
        x: 0,
        y: 0,
      },
    };
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform;
    // TODO: Переделать платформу
    if (!platform || !this.icon) return;

    const { x, y, width, height } = this.drawBounds;
    picto.drawRect(ctx, x, y, width, height, undefined, undefined, 50);
    picto.drawImage(
      ctx,
      this.icon,
      {
        x: x,
        y: y,
        width: width,
        height: height,
      },
      fontSizeMark
    );
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const { borderRadius } = this.computedStyles;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.roundRect(
      x,
      y,
      width / this.app.controller.scale,
      height / this.app.controller.scale,
      borderRadius
    );
    ctx.stroke();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
