import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { serializeTransitionActions } from '@renderer/lib/data/GraphmlBuilder';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { Transition, picto } from '@renderer/lib/drawable';
import { stateStyle, transitionStyle } from '@renderer/lib/styles';
import { Drawable } from '@renderer/lib/types';
import { drawText, prepareText } from '@renderer/lib/utils/text';
import theme from '@renderer/theme';

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
    if (!this.app.controller.visual) {
      this.update();
    }
  }

  update() {
    const platform = getPlatform(this.app.controller.platform[this.parent.smId].name);

    if (!this.parent.data.label || this.app.controller.visual || !platform) return;

    const text = serializeTransitionActions(
      this.parent.data.label,
      platform,
      this.app.controller.model.model.data.elements.stateMachines[this.parent.smId].components
    );

    this.textData = prepareText(text, 250 - 2 * 15, {
      fontFamily: 'Fira Sans',
      fontSize: 16,
      lineHeight: 1.2,
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.parent.data.label) return;

    this.drawBody(ctx);
    if (!this.app.controller.visual) {
      this.drawTextVariant(ctx);
    } else {
      this.drawImageVariant(ctx);
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D) {
    if (!this.parent.data.label) return;

    const { x, y, width, height } = this.parent.drawBounds;

    // TODO(bryzZz) Это должно переехать в тему
    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();

    ctx.roundRect(x, y, width, height, 8 / this.app.controller.scale);

    ctx.fill();
    ctx.closePath();
  }

  private drawImageVariant(ctx: CanvasRenderingContext2D) {
    const label = this.parent.data?.label;
    const platform = this.app.controller.platform;

    if (!label || !platform[this.parent.smId]) return;

    const { x, y, width, height } = this.parent.drawBounds;
    const eventMargin = picto.eventMargin;
    const p = 15 / this.app.controller.scale;
    const px = x + p;
    const py = y + p;
    const yDx = picto.eventHeight + 10;
    const fontSize = stateStyle.titleFontSize / this.app.controller.scale;
    const opacity = this.parent.data.selection ? 1.0 : 0.7;

    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.controller.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;
    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.app.controller.scale);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    if (
      label.trigger &&
      typeof label.trigger !== 'string' &&
      label.trigger.component !== '' &&
      label.trigger.method !== ''
    ) {
      const trigger = label.trigger;
      ctx.beginPath();
      platform[this.parent.smId].drawEvent(ctx, trigger, x + p, y + p);
      ctx.closePath();
    } else {
      picto.drawPicto(ctx, x + p, y + p, {
        rightIcon: 'condition',
      });
    }

    //Здесь начинается прорисовка действий и условий для связей
    if (label.condition && typeof label.condition !== 'string') {
      //TODO: Требуется допиливание прорисовки условий
      ctx.beginPath();
      if (label.condition) {
        const ax = 1;
        const ay = 0;
        const aX =
          px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.app.controller.scale;
        const aY = py + (ay * yDx) / this.app.controller.scale;
        platform[this.parent.smId].drawCondition(ctx, label.condition, aX, aY, opacity);
      }
      ctx.closePath();
    }

    if (label.do && typeof label.do !== 'string') {
      ctx.beginPath();
      label.do?.forEach((data, actIdx) => {
        const ax = 1 + (actIdx % eventRowLength);
        const ay = 1 + Math.floor(actIdx / eventRowLength);
        const aX =
          px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.app.controller.scale;
        const aY = py + (ay * yDx) / this.app.controller.scale;
        platform[this.parent.smId].drawAction(ctx, data, aX, aY, opacity);
      });
      ctx.closePath();
    }
  }

  private drawTextVariant(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.parent.drawBounds;
    const p = 15 / this.app.controller.scale;
    const fontSize = 16 / this.app.controller.scale;

    drawText(ctx, this.textData.textArray, {
      x: x + p,
      y: y + p,
      textAlign: 'left',
      color: theme.colors.diagram.transition.color,
      font: {
        fontSize,
        fontFamily: 'Fira Sans',
        lineHeight: 1.2,
      },
    });

    ctx.closePath();
  }
}
