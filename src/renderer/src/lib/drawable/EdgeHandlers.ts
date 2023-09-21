import { Point } from '@renderer/types/graphics';

import { State } from './State';

import { CanvasEditor } from '../CanvasEditor';
import { MyMouseEvent } from '../common/MouseEventEmitter';
import { isPointInRectangle } from '../utils';
import { icons } from './Picto';

/**
 * «Хваталки» для ноды, надстройка над State, отрисовывающая
 * элементы, позволяющие создать новый переход путём drag-n-drop.
 *
 * @privateRemarks
 * TODO: Возможно эти штуки нужно переделать на обычные dom div?
 */
export class EdgeHandlers {
  app!: CanvasEditor;
  state!: State;

  onStartNewTransition?: (state: State) => void;

  constructor(app: CanvasEditor, state: State) {
    this.app = app;
    this.state = state;
    this.app.mouse.on('mousedown', this.handleMouseDown);
  }

  unbindEvents() {
    this.app.mouse.off('mousedown', this.handleMouseDown);
  }

  get position(): Point[] {
    const offset = 4 / this.app.manager.data.scale;
    let {
      x: stateX,
      y: stateY,
      width: stateWidth,
      height: stateHeight,
      childrenHeight,
    } = this.state.drawBounds;

    stateHeight += childrenHeight ?? 0;

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

  get size() {
    return 20 / this.app.manager.data.scale;
  }

  setCurrentState(state: State) {
    this.state = state;
  }
  toJSON() {
    return this.state;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const icon = icons.get('EdgeHandle');
    if (!icon) return;

    ctx.beginPath();

    for (const { x, y } of this.position) {
      ctx.drawImage(icon, x, y, this.size, this.size);
    }

    ctx.fillStyle = '#FFF';
    ctx.fill();

    ctx.closePath();
  }

  handleMouseDown = (e: MyMouseEvent) => {
    if (!this.state.isSelected || !this.isMouseOver(e)) return;

    e.stopPropagation();

    this.onStartNewTransition?.(this.state);
  };

  isMouseOver(e: MyMouseEvent) {
    for (const { x, y } of this.position) {
      if (isPointInRectangle({ x, y, width: this.size, height: this.size }, { x: e.x, y: e.y })) {
        return true;
      }
    }

    return false;
  }
}
