import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { ArrowsWithLabel, ArrowsWithoutLabel, Label, Shape } from '@renderer/lib/drawable';
import { transitionStyle } from '@renderer/lib/styles';
import { GetCapturedNodeParams } from '@renderer/lib/types/drawable';
import { Point } from '@renderer/lib/types/graphics';
import { getLine } from '@renderer/lib/utils';

/**
 * Переход между состояниями.
 * Выполняет отрисовку стрелки между тремя движущимися блоками:
 * источник, назначение, а также условие перехода.
 */
export class Transition extends Shape {
  isSelected = false;
  label!: Label;
  arrow!: ArrowsWithLabel | ArrowsWithoutLabel;

  constructor(protected app: CanvasEditor, public id: string) {
    super(app, id);

    this.label = new Label(this, this.app);
    this.arrow = this.data.label
      ? new ArrowsWithLabel(this, this.app)
      : new ArrowsWithoutLabel(this, this.app);
  }

  get data() {
    return this.app.model.data.elements.transitions[this.id];
  }

  get source() {
    const node =
      this.app.controller.states.get(this.data.source) ||
      this.app.controller.notes.get(this.data.source);

    if (!node) {
      throw new Error(`State with id ${this.data.source} does not exist`);
    }

    return node;
  }

  get target() {
    const node =
      this.app.controller.states.get(this.data.target) ||
      this.app.controller.notes.get(this.data.target) ||
      this.app.controller.transitions.get(this.data.target);

    if (!node) {
      throw new Error(`State with id ${this.data.target} does not exist`);
    }
    return node;
  }

  get position() {
    return this.data.label?.position ?? { x: 0, y: 0 };
  }

  set position(value) {
    //Над этой ошибкой надо подумать, может и вовсе не стоит её оставлять.
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

  get transitionLine() {
    const targetBounds = this.target.drawBounds;
    const sourceBounds = this.source.drawBounds;

    const transitionLine = getLine({
      rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
      rect2: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
      rectPadding: 10,
    });

    return (
      transitionLine ?? {
        start: {
          x: 0,
          y: 0,
        },
        mid: null,
        end: {
          x: 0,
          y: 0,
        },
        se: 0,
        ee: 0,
      }
    );
  }

  set transitionLine(value) {
    if (!this.data.label) {
      throw new Error(`Transition with id ${this.id} does not have label`);
    }

    this.data.label.transitionLine = value;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.label.draw(ctx);
    this.arrow.draw(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.beginPath();
    ctx.strokeStyle = transitionStyle.bgColor;
    ctx.roundRect(x, y, width, height + childrenHeight, 8 / this.app.model.data.scale);
    ctx.stroke();
    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }

  private checkPointOnLine(pos, line): boolean {
    // FIXME: нужно ли масштабировать ширину линии?
    const lineWidth = 20; // Ширина линии

    const { x, y } = pos;
    if (line.mid) {
      // Проверка попадания на первую часть линии
      if (this.isPointOnSegment(line.start, line.mid, x, y, lineWidth)) return true;
      // Проверка попадания на вторую часть линии
      if (this.isPointOnSegment(line.mid, line.end, x, y, lineWidth)) return true;
    } else {
      // Проверка попадания на прямую линию
      if (this.isPointOnSegment(line.start, line.end, x, y, lineWidth)) return true;
    }
    return false;
  }

  // Метод для проверки попадания точки на линии
  isPointOnLine(x: number, y: number): boolean {
    const targetBounds = this.target.drawBounds;
    const sourceBounds = this.source.drawBounds;

    if (this.data.label) {
      const sourceLine = getLine({
        rect1: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
        rect2: this.drawBounds,
        rectPadding: 10,
      });
      const targetLine = getLine({
        rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
        rect2: this.drawBounds,
        rectPadding: 10,
      });
      return (
        this.checkPointOnLine({ x, y }, sourceLine) || this.checkPointOnLine({ x, y }, targetLine)
      );
    } else {
      const line = getLine({
        rect1: { ...targetBounds, height: targetBounds.height + targetBounds.childrenHeight },
        rect2: { ...sourceBounds, height: sourceBounds.height + sourceBounds.childrenHeight },
        rectPadding: 10,
      });
      return this.checkPointOnLine({ x, y }, line);
    }
  }

  // Метод для проверки попадания точки на отрезок с учетом ширины линии
  isPointOnSegment(start: Point, end: Point, x: number, y: number, lineWidth: number): boolean {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    // Проекция точки на линию
    let t = ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t)); // Ограничить t от 0 до 1

    // Находим ближайшую точку на линии
    const closestX = start.x + t * dx;
    const closestY = start.y + t * dy;

    // Рассчитываем расстояние от точки до ближайшей точки на линии
    const distance = Math.sqrt((x - closestX) * (x - closestX) + (y - closestY) * (y - closestY));

    // Проверяем, находится ли расстояние в пределах ширины линии
    return distance <= lineWidth / 2;
  }

  getIntersection(args: GetCapturedNodeParams): Shape | null {
    const { position } = args;

    if (this.isPointOnLine(position.x, position.y)) {
      return this;
    }

    return super.getIntersection(args);
  }
}
