import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { COMPONENT_DEFAULT_POSITION } from '@renderer/lib/constants';
import { Shape } from '@renderer/lib/drawable/Shape';
import { Dimensions, GetCapturedNodeParams, Layer, Point } from '@renderer/lib/types';
import { drawText } from '@renderer/lib/utils/text';
import theme from '@renderer/theme';

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
  constructor(
    app: CanvasEditor,
    id: string,
    icon: MarkedIconData,
    position: Point,
    parent?: Shape
  ) {
    super(app, id, parent);
    this.icon = icon;
    this.position = position;
    this.dimensions = {
      width: 150,
      height: 100,
    };
    this.children.add(
      new DrawableComponent(
        app,
        id,
        this.id,
        COMPONENT_DEFAULT_POSITION,
        { ...icon, label: undefined },
        this
      ),
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
    const { height, width, fontSize, paddingX, paddingY } = this.computedTitleSizes;
    ctx.beginPath();

    ctx.fillStyle = style.titleBg;

    ctx.roundRect(x, y, width, height, [
      6 / this.app.controller.scale,
      6 / this.app.controller.scale,
      0,
      0,
    ]);
    ctx.fill();
    drawText(ctx, this.icon.label || 'Без названия', {
      x: x + paddingX,
      y: y + paddingY,
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

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    if (this.isSelected) {
      this.drawSelection(ctx);
    }
    if (!this.children.isEmpty) {
      this.drawChildren(ctx, _canvas);
    }
    this.drawTitle(ctx);
  }

  private drawChildren(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    const { x, y, width, childrenHeight } = this.drawBounds;
    ctx.lineWidth = 2;
    ctx.strokeStyle = style.bodyBg;

    ctx.beginPath();

    ctx.roundRect(x + 1, y + this.titleHeight, width - 2, childrenHeight - this.titleHeight, [
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

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFF';

    ctx.roundRect(x, y, width, height, 6 / this.app.controller.scale);
    ctx.stroke();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }

  getIntersection(args: GetCapturedNodeParams): Shape | null {
    const { position, layer, exclude } = args;

    if (exclude?.includes(this)) return null;

    if (layer !== undefined) {
      for (let i = this.children.getSize(layer) - 1; i >= 0; i--) {
        const node = (this.children.layers[layer][i] as Shape)?.getIntersection(args);

        if (node) return node;
      }
    } else {
      for (let i = this.children.layers.length - 1; i >= 0; i--) {
        if (!this.children.layers[i]) continue;

        for (let j = this.children.layers[i].length - 1; j >= 0; j--) {
          const node = (this.children.layers[i][j] as Shape)?.getIntersection(args);

          if (node) return node;
        }
      }
    }

    if (this.isUnderMouse(position, true)) {
      return this;
    }

    return null;
  }
}
