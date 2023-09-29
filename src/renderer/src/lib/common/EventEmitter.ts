/**
 * Система обработки событий с подпиской и генерацией сигналов
 */
export class EventEmitter<T extends {} = {}> {
  handlers = new Map<string, Set<Function>>();
  offedOnce = new Set<string>();

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

  // Странная штука, нужна чтобы на один раз отключить событие
  addOnceOff(name: string) {
    this.offedOnce.add(name);
  }
  removeOnceOff(name: string) {
    this.offedOnce.delete(name);
  }

  reset() {
    this.handlers.clear();
  }

  emit(name: string, event: T) {
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
