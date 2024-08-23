import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Transition, picto } from '@renderer/lib/drawable';
import { stateStyle, transitionStyle } from '@renderer/lib/styles';
import { Drawable } from '@renderer/lib/types';

/**
 * Условие перехода между состояниями.
 * Выполняет отрисовку основного блока событий и действия при переходе:
 */
export class Label implements Drawable {
  constructor(private parent: Transition, protected app: CanvasEditor) {}

  draw(ctx: CanvasRenderingContext2D) {
    const label = this.parent.data.label;
    if (!label) return;

    const platform = this.app.controller.platform;

    if (!platform) return;

    const { x, y, width, height } = this.parent.drawBounds;
    const eventMargin = picto.eventMargin;
    const p = 15 / this.app.controller.model.data.scale;
    const px = x + p;
    const py = y + p;
    const yDx = picto.eventHeight + 10;
    const fontSize = stateStyle.titleFontSize / this.app.controller.model.data.scale;
    const opacity = this.parent.data.selection ? 1.0 : 0.7;

    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.controller.model.data.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;
    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.app.controller.model.data.scale);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    if (label.trigger && label.trigger.component !== '' && label.trigger.method !== '') {
      const trigger = label.trigger;
      ctx.beginPath();
      platform.drawEvent(ctx, trigger, x + p, y + p);
      ctx.closePath();
    } else {
      picto.drawPicto(ctx, x + p, y + p, {
        rightIcon: 'condition',
      });
    }

    //Здесь начинается прорисовка действий и условий для связей
    if (label.condition) {
      //TODO: Требуется допиливание прорисовки условий
      ctx.beginPath();
      if (label.condition) {
        const ax = 1;
        const ay = 0;
        const aX =
          px +
          (eventMargin + (picto.eventWidth + eventMargin) * ax) /
            this.app.controller.model.data.scale;
        const aY = py + (ay * yDx) / this.app.controller.model.data.scale;
        platform.drawCondition(ctx, label.condition, aX, aY, opacity);
      }
      ctx.closePath();
    }

    if (label.do) {
      ctx.beginPath();
      label.do?.forEach((data, actIdx) => {
        const ax = 1 + (actIdx % eventRowLength);
        const ay = 1 + Math.floor(actIdx / eventRowLength);
        const aX =
          px +
          (eventMargin + (picto.eventWidth + eventMargin) * ax) /
            this.app.controller.model.data.scale;
        const aY = py + (ay * yDx) / this.app.controller.model.data.scale;
        platform.drawAction(ctx, data, aX, aY, opacity);
      });
      ctx.closePath();
    }
  }
}
