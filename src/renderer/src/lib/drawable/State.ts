import { CanvasEditor } from '../CanvasEditor';
import { isPointInRectangle } from '../utils';
import { StatesGroup } from './StatesGroup';

export interface StateArgs {
  app: CanvasEditor;
  statesGroup: StatesGroup;
  id: string;

  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class State {
  id!: string;
  grabOffset = { x: 0, y: 0 };

  statesGroup!: StatesGroup;
  app!: CanvasEditor;

  bounds!: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(args: StateArgs) {
    Object.assign(this, args);

    this.app.mouse.on('mousedown', this.handleMouseDown);
    this.app.mouse.on('mousemove', this.handleMouseMove);
    this.app.mouse.on('mouseup', this.handleMouseUp);
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.beginPath();

    ctx.fillStyle = 'rgb(45, 46, 52)';

    ctx.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    ctx.fill();

    if (this.isSelected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFF';
      ctx.stroke();
    }

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText(this.id, this.bounds.x, this.bounds.y);

    ctx.closePath();
  }

  get isSelected() {
    return this.statesGroup.selectedStateId === this.id;
  }

  get isMouseOver() {
    return isPointInRectangle(
      {
        x: this.bounds.x,
        y: this.bounds.y,
        width: this.bounds.width,
        height: this.bounds.height,
      },
      { x: this.app.mouse.x, y: this.app.mouse.y }
    );
  }

  get isGrabbed() {
    return this.statesGroup.grabbedStateId === this.id;
  }

  handleMouseDown = () => {
    if (!this.app.mouse.left || !this.isMouseOver) return;

    this.statesGroup.setGrabbedId(this.id);
    this.grabOffset = {
      x: this.app.mouse.x - this.bounds.x,
      y: this.app.mouse.y - this.bounds.y,
    };
  };

  handleMouseMove = () => {
    if (!this.isGrabbed) return;

    this.bounds.x = this.app.mouse.x - this.grabOffset.x;
    this.bounds.y = this.app.mouse.y - this.grabOffset.y;

    this.app.isDirty = true;
  };

  handleMouseUp = (e: { nativeEvent: MouseEvent; stopPropagation: () => void }) => {
    if (!this.app.mouse.left || !this.isMouseOver) return;

    e.stopPropagation();

    this.statesGroup.setSelectedId(this.id);
  };
}
