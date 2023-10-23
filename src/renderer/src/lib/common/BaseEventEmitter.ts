type EventHandler<T extends object, N extends keyof T> = (e: T[N]) => void;

/**
 * Система обработки событий с подпиской и генерацией сигналов
 */
export abstract class BaseEventEmitter<
  T extends object,
  Name extends keyof T = keyof T,
  Handler extends EventHandler<T, Name> = EventHandler<T, Name>
> {
  handlers = new Map<Name, Set<EventHandler<T, Name>>>();
  offedOnce = new Set<Name>();

  on<N extends Name>(name: N, handler: EventHandler<T, N>) {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Set());
    }

    this.handlers.get(name)?.add(handler as Handler); // ? Не знаю что он тут ругается
  }

  off<N extends Name>(name: N, handler: EventHandler<T, N>) {
    if (!this.handlers.has(name)) {
      return;
    }

    const handlers = this.handlers.get(name);
    handlers?.delete(handler as Handler); // ? Не знаю что он тут ругается

    if (handlers?.size === 0) {
      this.handlers.delete(name);
    }
  }

  // Странная штука, нужна чтобы на один раз отключить событие
  addOnceOff(name: Name) {
    this.offedOnce.add(name);
  }
  removeOnceOff(name: Name) {
    this.offedOnce.delete(name);
  }

  reset() {
    this.handlers.clear();
  }

  abstract emit<N extends Name>(name: N, event: T[N]): void;
}
