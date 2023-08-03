/**
 * Система обработки событий с подпиской и генерацией сигналов
 */
export class EventEmitter<T extends {} = {}> {
  handlers = new Map<string, Set<Function>>();

  addEventListener(name: string, handler: (e: T) => any) {
    return this.on(name, handler);
  }

  on(name: string, handler: (e: T) => any) {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Set());
    }

    this.handlers.get(name)?.add(handler);
  }

  off(name: string, handler: (e: T) => any) {
    if (!this.handlers.has(name)) {
      return;
    }

    const handlers = this.handlers.get(name);
    handlers?.delete(handler);

    if (handlers?.size === 0) {
      this.handlers.delete(name);
    }
  }

  reset() {
    this.handlers.clear();
  }

  emit(name: string, event: T) {
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
