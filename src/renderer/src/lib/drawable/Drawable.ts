import { CanvasEditor } from '../CanvasEditor';

export interface DrawableArgs {
  app: CanvasEditor;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Drawable {
  app!: CanvasEditor;
  x!: number;
  y!: number;
  width!: number;
  height!: number;

  constructor(args: DrawableArgs) {
    Object.assign(this, args);
  }

  draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {}

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }
}
