import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Shape } from '@renderer/lib/drawable/Shape';
import { Dimensions, Point } from '@renderer/lib/types';
import { getColor } from '@renderer/theme';

import { MarkedIconData } from '../Picto';

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

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawBody(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    const platform = this.app.controller.platform[this.smId];

    if (!platform || !this.icon) return;

    const { x, y, width, height } = this.drawBounds;
    /*
      Записки разработчиков.

      Был баг с неправильным скейлом компонентов на схемоэкране, они были слишком большие 
      и визуально выходили за пределы контейнера.
      Проблема заключалась в том, что здесь для отрисовки используются низкоуровневые
      функции отрисовки Picto (обычно все отрисовывается через PlatformManager, который, 
      в свою очередь, использует высокоуровневую функцию drawPicto). И в drawPicto пиктограммы имеют фиксированный размер,
      выставляемый Picto. И поэтому со скейлом проблем там нет. НО drawRect и drawImage всегда скейлили входные данные.
      В итоге получалось так, что мы заскейленные значения из drawBounds передавали в drawImage/drawRect, где они скейлились еще раз. 

      Поэтому был добавлен флаг, который отключал скейл входных данных
    */
    this.app.view.picto.drawRect(
      ctx,
      x,
      y,
      width,
      height,
      undefined,
      undefined,
      50,
      undefined,
      undefined,
      true
    );
    this.app.view.picto.drawImage(
      ctx,
      this.icon,
      {
        x: x,
        y: y,
        width: width,
        height: height,
      },
      fontSizeMark,
      true
    );
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
