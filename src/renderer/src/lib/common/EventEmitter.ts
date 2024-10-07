import { BaseEventEmitter } from './BaseEventEmitter';

/**
 * Система обработки событий с подпиской и генерацией сигналов
 */
export class EventEmitter<
  T extends object,
  Name extends keyof T = keyof T
> extends BaseEventEmitter<T, Name> {
  emit<N extends Name>(name: N, event: T[N]) {
    if (this.offedOnce.has(name)) {
      this.offedOnce.delete(name);
      return;
    }
    if (this.handlers.has(name)) {
      const handlers = this.handlers.get(name);
      if (handlers) {
        for (const handler of handlers.values()) {
          handler(event);
        }
      }
    }
  }
}
