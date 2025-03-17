import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { ArrowsWithLabel, ArrowsWithoutLabel, Label, Shape } from '@renderer/lib/drawable';
import { GetCapturedNodeParams } from '@renderer/lib/types/drawable';
import { isPointOnLine } from '@renderer/lib/utils';
import { getColor } from '@renderer/theme';
import { Transition as DataTransition } from '@renderer/types/diagram';

/**
 * Переход между состояниями.
 */
export class Transition extends Shape {
  isSelected = false;
  label!: Label;
  arrow!: ArrowsWithLabel | ArrowsWithoutLabel;
  constructor(
    protected app: CanvasEditor,
    public id: string,
    public smId: string,
    public data: DataTransition
  ) {
    super(app, id);
    this.label = new Label(this, this.app);
    this.arrow = this.data.label
      ? new ArrowsWithLabel(this, this.app)
      : new ArrowsWithoutLabel(this, this.app);
  }

  get tooltipText() {
    return undefined;
  }

  get source() {
    const node =
      this.app.controller.states.get(this.data.sourceId) ||
      this.app.controller.notes.get(this.data.sourceId);

    if (!node) {
      throw new Error(`State with id ${this.data.sourceId} does not exist`);
    }

    return node;
  }

  get target() {
    const node =
      this.app.controller.states.get(this.data.targetId) ||
      this.app.controller.notes.get(this.data.targetId) ||
      this.app.controller.transitions.get(this.data.targetId);
    if (!node) {
      throw new Error(`State with id ${this.data.targetId} does not exist`);
    }
    return node;
  }

  get position() {
    return (
      this.data.label?.position ?? {
        x: (this.source.compoundPosition.x + this.target.compoundPosition.x) / 2,
        y: (this.source.compoundPosition.y + this.target.compoundPosition.y) / 2,
      }
    );
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

    if (!this.app.controller.visual) {
      return {
        width: 250,
        height: Math.max(70, this.label.textData.height + 15 * 2),
      };
    }

    return { width: 130, height: 70 };
  }

  set dimensions(_value) {
    throw new Error('Transition does not have dimensions');
    // this.data.dimensions = value;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.arrow.draw(ctx);
    this.label.draw(ctx);

    if (this.isSelected) {
      this.drawSelection(ctx);
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height, childrenHeight } = this.drawBounds;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = getColor('default-transition-outline');
    ctx.roundRect(x, y, width, height + childrenHeight, 8 / this.app.controller.scale);
    ctx.stroke();
    ctx.closePath();
  }

  setIsSelected(value: boolean) {
    this.isSelected = value;
  }

  getIntersection(args: GetCapturedNodeParams): Shape | null {
    const { position } = args;

    if (isPointOnLine(position.x, position.y, this)) {
      return this;
    }

    return super.getIntersection(args);
  }
}
