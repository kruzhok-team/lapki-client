import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import { Dimensions, Layer, Point } from '@renderer/lib/types';
import { drawText } from '@renderer/lib/utils/text';
import theme, { getColor } from '@renderer/theme';

import { DrawableComponent } from '../ComponentNode';
import { MarkedIconData } from '../Picto';

const style = theme.colors.diagram.state;
/**
 * Представление машины состояний на схемотехническом экране
 */
export class DrawableStateMachine extends Shape {
  isSelected = false;
  icon: MarkedIconData;
  position: Point;
  dimensions: Dimensions;
  constructor(app: CanvasEditor, id: string, icon: MarkedIconData, parent?: Shape) {
    super(app, id, parent);
    this.icon = icon;
    this.position = {
      x: 0,
      y: 0,
    };
    this.dimensions = {
      width: 150,
      height: 100,
    };
    this.children.add(
      new DrawableComponent(app, id, this.id, { x: 0, y: 0 }, { ...icon, label: undefined }, this),
      Layer.Components
    );
  }

  get titleHeight() {
    const fontSize = 15;
    const paddingY = 10;
    return fontSize + paddingY * 2;
  }

  get computedTitleSizes() {
    return {
      height: this.titleHeight / this.app.controller.scale,
      width: this.drawBounds.width,
      fontSize: 15 / this.app.controller.scale,
      paddingX: 15 / this.app.controller.scale,
      paddingY: 10 / this.app.controller.scale,
    };
  }

  //Прорисовка заголовка блока состояния
  private drawTitle(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.drawBounds;
    const stateMachineHeight = this.drawBounds.height;
    const { height, width, fontSize, paddingX, paddingY } = this.computedTitleSizes;
    const computedY = y + stateMachineHeight - height;
    ctx.beginPath();

    ctx.fillStyle = style.titleBg;

    ctx.roundRect(x, computedY, width, height, [
      6 / this.app.controller.scale,
      6 / this.app.controller.scale,
      0,
      0,
    ]);
    ctx.fill();
    drawText(ctx, this.icon.label || 'Без названия', {
      x: x + paddingX,
      y: computedY + paddingY,
      textAlign: 'left',
      color: this.icon.label !== '' ? style.titleColor : style.titleColorUndefined,
      font: {
        fontSize,
        lineHeight: 1,
        fontFamily: 'Fira Sans',
      },
    });

    ctx.closePath();
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

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (this.isSelected) {
      this.drawSelection(ctx);
    }
    if (!this.children.isEmpty) {
      this.drawChildrenBorder(ctx);
    }
    this.drawTitle(ctx);
  }

  private drawChildrenBorder(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + height, width - 2, childrenHeight, [
      0,
      0,
      6 / this.app.controller.scale,
      6 / this.app.controller.scale,
    ]);
    ctx.stroke();

    ctx.closePath();
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
