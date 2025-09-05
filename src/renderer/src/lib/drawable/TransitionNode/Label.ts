import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { serializeTransitionActions } from '@renderer/lib/data/GraphmlBuilder';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { Transition } from '@renderer/lib/drawable';
import { stateStyle } from '@renderer/lib/styles';
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

    // левый угол перехода
    const { x, y, width, height } = this.parent.drawBounds;
    const eventMargin = this.app.view.picto.eventMargin;
    // отступ от краев перехода, откуда мы начинаем рисовать пиктограмму
    const p = 15 / this.app.controller.scale;
    const px = x + p;
    const py = y + p;
    // смещение по вертикали между ДЕЙСТВИЯМИ
    const yDx = this.app.view.picto.eventHeight + 5;
    // смещение по вертикали между условием и началом блока действий
    const conditionYDx = this.app.view.picto.pictoHeight + 5;
    const fontSize = stateStyle.titleFontSize / this.app.controller.scale;
    const opacity = this.parent.data.selection ? 1.0 : 0.7;

    const scale = this.app.controller.scale;
    // Широчайшая пиктограмма или этот размер
    // const eventRowLength = Math.max(
    //   3,
    //   Math.floor((width * this.app.controller.scale - 30) / (this.app.view.picto.eventWidth + 5)) -
    //     1
    // );
    // Вычисление требуемой ширины содержимого строки по правилу:
    // max(самое большое действие + отступы, стандарт — 3*eventWidth + 2*отступа)
    const threeStdWidth = 3 * this.app.view.picto.eventWidth + 3 * eventMargin;
    let largestAction = 0;
    if (label.do && typeof label.do !== 'string') {
      for (const a of label.do) {
        const w = platform[this.parent.smId].calculateActionSize(a).width;
        if (w > largestAction) largestAction = w;
      }
    }
    const rowWidth = Math.max(threeStdWidth / scale, largestAction);

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;
    ctx.fillStyle = 'rgb(100, 100, 100)'; // ТУТ ЦВЕТ ПЕРЕХОДА

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.app.controller.scale);
    ctx.fill();
    ctx.closePath();

    // отрисовка пикограммы события
    if (
      label.trigger &&
      typeof label.trigger !== 'string' &&
      label.trigger.component !== '' &&
      label.trigger.method !== ''
    ) {
      const trigger = label.trigger;
      ctx.beginPath();
      platform[this.parent.smId].drawEvent(ctx, trigger, px, py);
      ctx.closePath();
    } else {
      this.app.view.picto.drawPicto(
        ctx,
        py,
        px,
        {
          rightIcon: 'condition',
        },
        []
      );
    }

    //Здесь начинается прорисовка действий и условий для связей
    let aY = py; // текущая y, от которой отрисовываем пиктограмму, смещаем по мере отрисовки
    if (label.condition) {
      const ax = 1;
      const aX =
        px +
        (eventMargin + (this.app.view.picto.eventWidth + eventMargin) * ax) /
          this.app.controller.scale;
      if (label.condition === 'else') {
        platform[this.parent.smId].drawText(ctx, 'else', aX, aY, opacity);
      }
      //TODO: Требуется допиливание прорисовки условий
      ctx.beginPath();
      if (label.condition && typeof label.condition !== 'string') {
        platform[this.parent.smId].drawCondition(ctx, label.condition, aX, aY, opacity);
      }
      ctx.closePath();
    }
    aY += conditionYDx / scale; // всегда делаем смещение, даже если не было условия
    if (label.do && typeof label.do !== 'string') {
      ctx.beginPath();
      // Динамическая раскладка действий по ширине контейнера с переносом строк
      const startX =
        px +
        (eventMargin + (this.app.view.picto.eventWidth + eventMargin) * 1) /
          this.app.controller.scale;
      let currentActionCoordX = startX; // текущая координата x для отрисовки действия с учетом отступа
      label.do.forEach((data) => {
        const pictoDimensions = platform[this.parent.smId].calculateActionSize(data);
        const actionWidth = pictoDimensions.width;
        if (currentActionCoordX + actionWidth < startX + rowWidth) {
          platform[this.parent.smId].drawAction(ctx, data, currentActionCoordX, aY, opacity);
        } else {
          aY += yDx / this.app.controller.scale; // если не влазим в строку, делаем перенос
          currentActionCoordX = startX;
          platform[this.parent.smId].drawAction(ctx, data, currentActionCoordX, aY, opacity);
        }
        currentActionCoordX += actionWidth + eventMargin / this.app.controller.scale;
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
