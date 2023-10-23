import { BaseEventEmitter } from './BaseEventEmitter';

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

interface MouseEvents {
  mousedown: MyMouseEvent;
  mouseup: MyMouseEvent;
  mousemove: MyMouseEvent;
  contextmenu: MyMouseEvent;
  dblclick: MyMouseEvent;
  wheel: MyMouseEvent & { nativeEvent: WheelEvent };
}

/**
 * Система обработки событий специально для мыши.
 * Отличается от обычного {@link EventEmitter} возможностью отключить
 * вызов обработчиков событий на любом из шагов (stopPropagation).
 */
export class MouseEventEmitter<
  T extends object = MouseEvents,
  Name extends keyof T = keyof T
> extends BaseEventEmitter<T, Name> {
  emit<N extends Name>(name: N, event: Omit<T[N], 'stopPropagation'>) {
    if (this.handlers.has(name)) {
      const handlers = this.handlers.get(name);

      if (handlers) {
        let stop = false;

        (event as any).stopPropagation = () => {
          stop = true;
        };

        const arr = [...handlers.values()];

        for (let i = arr.length - 1; i >= 0; i--) {
          if (stop) break;

          arr[i](event as T[N]);
        }
      }
    }
  }
}
