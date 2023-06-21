export interface StateArgs {
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
  bounds!: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(args: StateArgs) {
    Object.assign(this, args);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    options?: { isSelected: boolean }
  ) {
    ctx.beginPath();

    // Draw body
    ctx.fillStyle = 'rgb(45, 46, 52)';
    ctx.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    ctx.fill();

    if (options?.isSelected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFF';
      ctx.stroke();

      ctx.rect(this.bounds.x + this.bounds.width / 2 - 10, this.bounds.y - 22, 20, 20);
      ctx.fillStyle = 'red';
      ctx.fill();
    }

    // Draw text
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText(this.id, this.bounds.x, this.bounds.y);

    ctx.closePath();
  }

  move(x: number, y: number) {
    this.bounds.x = x;
    this.bounds.y = y;
  }
}
