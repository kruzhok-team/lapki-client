import { BaseEventEmitter } from './BaseEventEmitter';

/**
 * Система обработки событий специально для мыши.
 * Отличается от обычного {@link EventEmitter} возможностью отключить
 * вызов обработчиков событий на любом из шагов (stopPropagation).
 */
export class BubbleEventEmitter<
  T extends object,
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
