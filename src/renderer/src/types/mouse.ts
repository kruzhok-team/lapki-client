/**
 * Интерфейс, реализующий события, связанные с мышью.
 * Используется в {@link MouseEventEmitter}.
 */
export interface MyMouseEvent {
  x: number;
  y: number;
  dx: number;
  dy: number;
  /**
   * Наличие зажатой левой кнопки.
   * Полезно для отслеживания перетаскивания.
   */
  left: boolean;
  right: boolean;
  button: Button;
  stopPropagation: () => void;
  nativeEvent: MouseEvent;
}

export enum Button {
  left = 0,
  middle = 1,
  right = 2,
  back = 3,
  forward = 4,
}

export interface MouseEvents {
  mousedown: MyMouseEvent;
  mouseup: MyMouseEvent;
  mousemove: MyMouseEvent;
  dblclick: MyMouseEvent;
  rightclick: MyMouseEvent;
  wheel: MyMouseEvent & { nativeEvent: WheelEvent };
}
