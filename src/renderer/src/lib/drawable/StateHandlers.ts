import { CanvasEditor } from '../CanvasEditor';
import { isPointInRectangle } from '../utils';
import { State } from './State';

export class StateHandlers {
  app!: CanvasEditor;
  currentState: State | null = null;

  onStartNewTransition!: () => void;

  size = 20;

  constructor(app: CanvasEditor, onStartNewTransition: () => void) {
    this.app = app;
    this.onStartNewTransition = onStartNewTransition;

    this.app.mouse.addEventListener('mousedown', this.handleMouseDown);
  }

  get position() {
    if (!this.currentState) return null;

    const offset = 4;
    const stateX = this.currentState.bounds.x;
    const stateY = this.currentState.bounds.y;
    const stateWidth = this.currentState.bounds.width;
    const stateHeight = this.currentState.bounds.height;

    return [
      {
        x: stateX + stateWidth / 2 - this.size / 2,
        y: stateY - this.size - offset,
      },
      {
        x: stateX + stateWidth / 2 - this.size / 2,
        y: stateY + stateHeight + offset,
      },
      {
        x: stateX - this.size - offset,
        y: stateY + stateHeight / 2 - this.size / 2,
      },
      {
        x: stateX + stateWidth + offset,
        y: stateY + stateHeight / 2 - this.size / 2,
      },
    ];
  }

  setCurrentState(state: State) {
    this.currentState = state;
  }

  remove() {
    this.currentState = null;
  }

  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.currentState || !this.position) return;

    ctx.beginPath();

    for (const { x, y } of this.position) {
      ctx.rect(x, y, this.size, this.size);
    }

    ctx.fillStyle = '#FFF';
    ctx.fill();

    ctx.closePath();
  }

  handleMouseDown = () => {
    if (!this.currentState || !this.position || !this.isMouseOver()) {
      return;
    }

    this.onStartNewTransition();
  };

  isMouseOver() {
    if (!this.position) return false;

    for (const { x, y } of this.position) {
      if (
        isPointInRectangle(
          { x, y, width: this.size, height: this.size },
          { x: this.app.mouse.x, y: this.app.mouse.y }
        )
      ) {
        return true;
      }
    }

    return false;
  }
}
