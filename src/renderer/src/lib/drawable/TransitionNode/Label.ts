import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { serializeTransitionActions } from '@renderer/lib/data/GraphmlBuilder';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { Transition, picto } from '@renderer/lib/drawable';
import { Drawable } from '@renderer/lib/types';
import { drawText, prepareText } from '@renderer/lib/utils/text';
import { getColor } from '@renderer/theme';

/**
 * Условие перехода между состояниями.
 * Выполняет отрисовку основного блока событий и действия при переходе:
 */
export class Label implements Drawable {
  textData = {
    height: 100,
    textArray: [] as string[],
  };

  constructor(private parent: Transition, protected app: CanvasEditor) {
    if (!this.app.model.data.elements.visual) {
      this.update();
    }
  }

  update() {
    const platform = getPlatform(this.app.model.data.elements.platform);

    if (!this.parent.data.label || this.app.model.data.elements.visual || !platform) return;

    const text = serializeTransitionActions(
      this.parent.data.label,
      platform,
      this.app.model.data.elements.components
    );

    this.textData = prepareText(text, 200 - 2 * 15, {
      fontFamily: 'Fira Mono',
      fontSize: 16,
      lineHeight: 1.2,
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.parent.data.label) return;

    this.drawBody(ctx);

    if (!this.app.model.data.elements.visual) {
      this.drawTextVariant(ctx);
    } else {
      this.drawImageVariant(ctx);
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    if (!this.parent.data.label) return;

    const { x, y, width, height } = this.parent.drawBounds;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, 8 / this.app.model.data.scale);

    ctx.fill();
    ctx.closePath();
  }

  private drawImageVariant(ctx: CanvasRenderingContext2D) {
    const label = this.parent.data?.label;
    const platform = this.app.controller.platform;
    if (!label || !platform) return;

    const { x, y, width } = this.parent.drawBounds;
    const eventMargin = picto.eventMargin;
    const p = 15 / this.app.model.data.scale;
    const px = x + p;
    const py = y + p;
    const yDx = picto.eventHeight + 10;
    const opacity = this.parent.data.selection ? 1.0 : 0.7;
    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.model.data.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    if (label.trigger && typeof label.trigger !== 'string') {
      const trigger = label.trigger;
      ctx.beginPath();
      platform.drawEvent(ctx, trigger, x + p, y + p);
      ctx.closePath();
    }

    //Здесь начинается прорисовка действий и условий для связей
    if (label.condition && typeof label.condition !== 'string') {
      //TODO: Требуется допиливание прорисовки условий
      ctx.beginPath();
      if (label.condition) {
        const ax = 1;
        const ay = 0;
        const aX =
          px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.app.model.data.scale;
        const aY = py + (ay * yDx) / this.app.model.data.scale;
        platform.drawCondition(ctx, label.condition, aX, aY, opacity);
      }
      ctx.closePath();
    }

    if (label.do && typeof label.do !== 'string') {
      ctx.beginPath();
      label.do?.forEach((data, actIdx) => {
        const ax = 1 + (actIdx % eventRowLength);
        const ay = 1 + Math.floor(actIdx / eventRowLength);
        const aX =
          px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.app.model.data.scale;
        const aY = py + (ay * yDx) / this.app.model.data.scale;
        platform.drawAction(ctx, data, aX, aY, opacity);
      });
      ctx.closePath();
    }
  }

  private drawTextVariant(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.parent.drawBounds;
    const p = 15 / this.app.model.data.scale;
    const fontSize = 16 / this.app.model.data.scale;

    drawText(ctx, this.textData.textArray, {
      x: x + p,
      y: y + p,
      textAlign: 'left',
      color: getColor('text-primary'),
      font: {
        fontSize,
        fontFamily: 'Fira Mono',
        lineHeight: 1.2,
      },
    });

    ctx.closePath();
  }
}
