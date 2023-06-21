import { CanvasEditor } from '../CanvasEditor';
import { isPointInRectanle } from '../util';
import { StatesGroup } from './StatesGroup';

export interface StateArgs {
  app: CanvasEditor;
  statesGroup: StatesGroup;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class State {
  id!: string;
  grabbed = false;
  grabOffset = { x: 0, y: 0 };
  mouseover = false;

  statesGroup!: StatesGroup;
  app!: CanvasEditor;
  x!: number;
  y!: number;
  width!: number;
  height!: number;

  constructor(args: StateArgs) {
    Object.assign(this, args);

    this.app.mouse.on('mousedown', () => {
      if (this.app.mouse.left) {
        if (
          isPointInRectanle(
            { x: this.x, y: this.y, width: this.width, height: this.height },
            { x: this.app.mouse.x, y: this.app.mouse.y }
          )
        ) {
          this.grabbed = true;
          this.grabOffset = { x: this.app.mouse.x - this.x, y: this.app.mouse.y - this.y };
        }
      }
    });

    this.app.mouse.on('mousedown', () => {
      if (this.app.mouse.left) {
        if (
          isPointInRectanle(
            { x: this.x, y: this.y, width: this.width, height: this.height },
            { x: this.app.mouse.x, y: this.app.mouse.y }
          )
        ) {
          this.grabbed = true;
          this.grabOffset = { x: this.app.mouse.x - this.x, y: this.app.mouse.y - this.y };
        }
      }
    });

    this.app.mouse.on('mousemove', () => {
      if (
        isPointInRectanle(
          { x: this.x, y: this.y, width: this.width, height: this.height },
          { x: this.app.mouse.x, y: this.app.mouse.y }
        )
      ) {
        this.mouseover = true;
      } else {
        this.mouseover = false;
      }

      if (this.grabbed) {
        this.x = this.app.mouse.x - this.grabOffset.x;
        this.y = this.app.mouse.y - this.grabOffset.y;

        this.app.isDirty = true;
      }
    });

    this.app.mouse.on('mouseup', () => {
      if (
        isPointInRectanle(
          { x: this.x, y: this.y, width: this.width, height: this.height },
          { x: this.app.mouse.x, y: this.app.mouse.y }
        )
      ) {
        this.statesGroup.setSelectedId(this.id);
        this.app.isDirty = true;
      }

      if (this.grabbed) {
        this.grabbed = false;
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.beginPath();

    ctx.fillStyle = 'rgb(45, 46, 52)';

    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();

    if (this.statesGroup.selectedStateId === this.id) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFF';
      ctx.stroke();
    }

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText(this.id, this.x, this.y);

    ctx.closePath();

    return true;
  }
}
