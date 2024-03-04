import { getColor } from '@renderer/theme';
import { Transition as TransitionType } from '@renderer/types/diagram';

import { Node } from './Node';
import { picto } from './Picto';
import { State } from './State';

import { Container } from '../basic/Container';
import { stateStyle, transitionStyle } from '../styles';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getTransitionLines,
} from '../utils';
import { drawText, prepareText } from '../utils/text';

/**
 * Переход между состояниями.
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также условие перехода.
 */
export class Transition extends Node {
  isSelected = false;
  private textData = {
    height: 100,
    textArray: [] as string[],
  };

  constructor(container: Container, id: string) {
    super(container, id);

    if (this.container.app.textMode) {
      this.prepareText();
    }
  }

  get data(): TransitionType {
    return this.container.app.manager.data.elements.transitions[this.id];
  }

  get source() {
    return this.container.machineController.states.get(this.data.source) as State;
  }

  get target() {
    return this.container.machineController.states.get(this.data.target) as State;
  }

  get bounds() {
    if (this.container.app.textMode) {
      return { ...this.data.position, width: 200, height: Math.max(70, this.textData.height) };
    }

    return { ...this.data.position, width: 130, height: 70 };
  }

  set bounds(value) {
    this.data.position.x = value.x;
    this.data.position.y = value.y;
  }

  prepareText() {
    this.textData = {
      ...prepareText({
        text: 'timer1.timeout/',
        maxWidth: 200 - 2 * 15,
        fontFamily: 'Fira Sans',
        fontSize: 16,
        lineHeight: 1.4,
      }),
    };
  }

  draw(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    this.drawArrows(ctx);
    if (this.container.app.textMode) {
      return this.drawTextCondition(ctx);
    }

    this.drawImageCondition(ctx);
  }

  private drawImageCondition(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const eventMargin = picto.eventMargin;
    const p = 15 / this.container.app.manager.data.scale;
    const fontSize = stateStyle.titleFontSize / this.container.app.manager.data.scale;
    const opacity = this.isSelected ? 1.0 : 0.7;
    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.container.app.manager.data.scale);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    const trigger = this.data.trigger;
    const platform = this.container.machineController.platform;
    ctx.beginPath();
    platform.drawEvent(ctx, trigger, x + p, y + p);
    ctx.closePath();

    //Здесь начинается прорисовка действий и условий для связей
    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.container.app.manager.data.scale - 30) / (picto.eventWidth + 5)) - 1
    );
    const px = x + p;
    const py = y + p;
    const yDx = picto.eventHeight + 10;

    //Условия
    //TODO: Требуется допиливание прорисовки условий
    ctx.beginPath();
    if (this.data.condition) {
      const ax = 1;
      const ay = 0;
      const aX =
        px +
        (eventMargin + (picto.eventWidth + eventMargin) * ax) /
          this.container.app.manager.data.scale;
      const aY = py + (ay * yDx) / this.container.app.manager.data.scale;
      platform.drawCondition(ctx, this.data.condition, aX, aY, opacity);
    }
    ctx.closePath();

    //Действия
    ctx.beginPath();
    this.data.do?.forEach((data, actIdx) => {
      const ax = 1 + (actIdx % eventRowLength);
      const ay = 1 + Math.floor(actIdx / eventRowLength);
      const aX =
        px +
        (eventMargin + (picto.eventWidth + eventMargin) * ax) /
          this.container.app.manager.data.scale;
      const aY = py + (ay * yDx) / this.container.app.manager.data.scale;
      platform.drawAction(ctx, data, aX, aY, opacity);
    });
    ctx.closePath();

    /*
    ctx.fillText(trigger.component, x + p, y + p);
    ctx.fillText(trigger.method, x + p, y + fontSize + p);
    ctx.closePath();
    */

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawTextCondition(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.drawBounds;
    const p = 15 / this.container.app.manager.data.scale;
    const fontSize = 16 / this.container.app.manager.data.scale;

    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.container.app.manager.data.scale);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();

    drawText(ctx, this.textData.textArray, {
      x: x + p,
      y: y + p,
      textAlign: 'left',
      color: getColor('text-primary'),
      fontSize,
      fontFamily: 'monospace',
      lineHeight: 1.4,
    });

    ctx.closePath();
  }

  private drawArrows(ctx: CanvasRenderingContext2D) {
    const sourceBounds = this.source.drawBounds;
    const targetBounds = this.target.drawBounds;

    const { sourceLine, targetLine } = getTransitionLines(
      { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      this.drawBounds,
      10,
      3,
      3
    );

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.data.color;
    ctx.fillStyle = this.data.color;

    drawCurvedLine(ctx, sourceLine, 12 / this.container.app.manager.data.scale);
    drawCurvedLine(ctx, targetLine, 12 / this.container.app.manager.data.scale);
    drawCircle(
      ctx,
      sourceLine.start,
      transitionStyle.startSize / this.container.app.manager.data.scale
    );
    drawTriangle(
      ctx,
      targetLine.start,
      10 / this.container.app.manager.data.scale,
      degrees_to_radians(targetLine.se)
    );
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    // NOTE: Для каждого нового объекта рисования требуется указывать их начало и конец,
    //       а перед ними прописывать стили!
    ctx.beginPath();
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.roundRect(x, y, width, height + childrenHeight, 8 / this.container.app.manager.data.scale);
    ctx.stroke();
    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
