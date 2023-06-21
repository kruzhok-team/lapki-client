export class EventEmitter<T extends Event> {
  handlers = new Map<string, Set<Function>>();

  addEventListener(
    name: string,
    handler: (e: { nativeEvent: T; stopPropagation: () => void }) => any
  ) {
    return this.on(name, handler);
  }

  on(name: string, handler: (e: { nativeEvent: T; stopPropagation: () => void }) => any) {
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

  emit(name: string, event: T) {
    if (this.handlers.has(name)) {
      const handlers = this.handlers.get(name);

      if (handlers) {
        /* Тут события вызываются в обратном порядке как при всплытии в DOM это нужно для того чтобы можно было это всплытие отключить */
        const values = [...handlers.values()];
        let stop = false;

        for (let i = values.length - 1; i >= 0; i--) {
          const stopPropagation = () => {
            stop = true;
          };

          values[i]({ nativeEvent: event, stopPropagation });

          if (stop) break;
        }
      }
    }
  }
}
