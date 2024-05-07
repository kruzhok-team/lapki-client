import { picto, Shape } from '@renderer/lib/drawable';
import { stateStyle, transitionStyle } from '@renderer/lib/styles';
import {
  degrees_to_radians,
  drawCircle,
  drawCurvedLine,
  drawTriangle,
  getLine,
  getTransitionLines,
} from '@renderer/lib/utils';

import { CanvasEditor } from '../CanvasEditor';

/**
 * Переход между состояниями.
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также условие перехода.
 */
export class Transition extends Shape {
  isSelected = false;

  constructor(app: CanvasEditor, id: string) {
    super(app, id);
  }

  get data() {
    return this.app.model.data.elements.transitions[this.id];
  }

  get source() {
    const state = this.app.controller.states.get(this.data.source);

    if (!state) {
      throw new Error(`State with id ${this.data.source} does not exist`);
    }

    return state;
  }

  get target() {
    const state = this.app.controller.states.get(this.data.target);

    if (!state) {
      throw new Error(`State with id ${this.data.target} does not exist`);
    }

    return state;
  }

  get position() {
    return this.data.label?.position ?? { x: 0, y: 0 };
  }
  set position(value) {
    if (!this.data.label) {
      throw new Error(`Transition with id ${this.id} does not have label`);
    }

    this.data.label.position = value;
  }
  get dimensions() {
    if (!this.data.label) {
      return { width: 0, height: 0 };
    }

    return { width: 130, height: 70 };
  }
  set dimensions(_value) {
    throw new Error('Transition does not have dimensions');
    // this.data.dimensions = value;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawArrows(ctx);
    this.drawLabel(ctx);
  }

  private drawLabel(ctx: CanvasRenderingContext2D) {
    if (!this.data.label) return;

    const { x, y, width, height } = this.drawBounds;
    const eventMargin = picto.eventMargin;
    const p = 15 / this.app.model.data.scale;
    const px = x + p;
    const py = y + p;
    const yDx = picto.eventHeight + 10;
    const fontSize = stateStyle.titleFontSize / this.app.model.data.scale;
    const opacity = this.isSelected ? 1.0 : 0.7;

    const platform = this.app.controller.platform;
    const eventRowLength = Math.max(
      3,
      Math.floor((width * this.app.model.data.scale - 30) / (picto.eventWidth + 5)) - 1
    );

    ctx.font = `${fontSize}px/${stateStyle.titleLineHeight} ${stateStyle.titleFontFamily}`;
    ctx.fillStyle = stateStyle.eventColor;
    ctx.textBaseline = stateStyle.eventBaseLine;
    ctx.fillStyle = 'rgb(23, 23, 23)';

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / this.app.model.data.scale);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = transitionStyle.bgColor;

    if (this.data.label.trigger) {
      const trigger = this.data.label.trigger;
      ctx.beginPath();
      platform.drawEvent(ctx, trigger, x + p, y + p);
      ctx.closePath();
    }

    //Здесь начинается прорисовка действий и условий для связей
    if (this.data.label.condition) {
      //TODO: Требуется допиливание прорисовки условий
      ctx.beginPath();
      if (this.data.label.condition) {
        const ax = 1;
        const ay = 0;
        const aX =
          px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.app.model.data.scale;
        const aY = py + (ay * yDx) / this.app.model.data.scale;
        platform.drawCondition(ctx, this.data.label.condition, aX, aY, opacity);
      }
      ctx.closePath();
    }

    if (this.data.label.do) {
      ctx.beginPath();
      this.data.label.do?.forEach((data, actIdx) => {
        const ax = 1 + (actIdx % eventRowLength);
        const ay = 1 + Math.floor(actIdx / eventRowLength);
        const aX =
          px + (eventMargin + (picto.eventWidth + eventMargin) * ax) / this.app.model.data.scale;
        const aY = py + (ay * yDx) / this.app.model.data.scale;
        platform.drawAction(ctx, data, aX, aY, opacity);
      });
      ctx.closePath();
    }

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    // NOTE: Для каждого нового объекта рисования требуется указывать их начало и конец,
    //       а перед ними прописывать стили!
    ctx.beginPath();
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.roundRect(x, y, width, height + childrenHeight, 8 / this.app.model.data.scale);
    ctx.stroke();
    ctx.closePath();
  }

  private drawArrowsWithLabel(ctx: CanvasRenderingContext2D) {
    const sourceBounds = this.source.drawBounds;
    const targetBounds = this.target.drawBounds;

    const { sourceLine, targetLine } = getTransitionLines(
      { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      this.drawBounds,
      10
    );

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.data.color;
    ctx.fillStyle = this.data.color;

    drawCurvedLine(ctx, sourceLine, 12 / this.app.model.data.scale);
    drawCurvedLine(ctx, targetLine, 12 / this.app.model.data.scale);
    drawCircle(ctx, {
      position: sourceLine.start,
      radius: transitionStyle.startSize / this.app.model.data.scale,
      fillStyle: this.data.color,
    });
    drawTriangle(
      ctx,
      targetLine.start,
      10 / this.app.model.data.scale,
      degrees_to_radians(targetLine.se)
    );
  }

  private drawArrowsWithoutLabel(ctx: CanvasRenderingContext2D) {
    const targetBounds = this.target.drawBounds;
    const sourceBounds = this.source.drawBounds;

    const line = getLine(
      { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      10
    );

    ctx.lineWidth = transitionStyle.width;
    ctx.strokeStyle = this.data.color;
    ctx.fillStyle = this.data.color;

    drawCurvedLine(ctx, line, 12 / this.app.model.data.scale);
    drawCircle(ctx, {
      position: line.end,
      radius: transitionStyle.startSize / this.app.model.data.scale,
      fillStyle: this.data.color,
    });
    drawTriangle(ctx, line.start, 10 / this.app.model.data.scale, degrees_to_radians(line.se));
  }

  private drawArrows(ctx: CanvasRenderingContext2D) {
    if (this.data.label) {
      return this.drawArrowsWithLabel(ctx);
    }

    return this.drawArrowsWithoutLabel(ctx);
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }
}
