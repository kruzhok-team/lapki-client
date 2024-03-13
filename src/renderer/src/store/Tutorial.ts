import { useSyncExternalStore } from 'react';

export type TutorialItem = { title: string; content: string; showed: boolean };
type TutorialItems = Record<string, TutorialItem>;

/**
 * (bryzZz)
 * Класс отвечающий за показ контекстной справки к элементам
 */
export class Tutorial {
  private items: TutorialItems = {};

  private pendingQueue: string[] = [];
  private subscribers = new Map<string, () => void>();

  private reactDataListeners = new Map<string, Array<() => void>>(); //! Подписчиков обнулять нельзя, react сам разбирается

  constructor() {
    // TODO(bryzZz) Подгрузка туториала из файла
    const data = {
      items: {
        '1': {
          title: 'Пример',
          content: 'Попробуй добавить новый компонент',
          showed: false,
        },
        '2': {
          title: 'Иерархия состояний',
          content: 'Иерархия состояний позволяет посмотреть компоненты схемы ввиде списка',
          showed: false,
        },
      },
    };

    this.setItems(data.items);
  }

  setItems = (items: TutorialItems) => {
    this.items = items;
  };

  private subscribe = (id: string) => (listener: () => void) => {
    if (!this.reactDataListeners.has(id)) {
      this.reactDataListeners.set(id, [listener]);
    } else {
      this.reactDataListeners.get(id)?.push(listener);
    }

    return () => {
      const listeners = this.reactDataListeners.get(id) ?? [];

      if (listeners?.length === 0) {
        return this.reactDataListeners.delete(id);
      }

      return this.reactDataListeners.set(
        id,
        listeners.filter((l) => l !== listener)
      );
    };
  };

  /**
   * (bryzZz)
   * Подписка на отдельный эдемент в react.
   * Нужно для того чтобы после просмотра части туториала react обновлял компонент и уже не вызывал кучу кода отвечающего за показ.
   */
  useGetItem = (id: string) => {
    const getSnapshot = () => {
      return this.items[id];
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(this.subscribe(id), getSnapshot);
  };

  private emitShow = (itemId: string) => {
    this.subscribers.get(itemId)?.();
  };

  /**
   * (bryzZz)
   * Запрос на показ части туториала (когда нужный эдемент попадает в поле видимости)
   */
  requestShow = (itemId: string) => {
    this.pendingQueue.push(itemId);

    if (this.pendingQueue.length === 1) {
      this.emitShow(itemId);
    }
  };

  /**
   * (bryzZz)
   * Отмена запроса на показ части туториала (если нужный элемент вышел из поля видимости не успев показать туториал)
   */
  cancelShow = (itemId: string) => {
    this.pendingQueue = this.pendingQueue.filter((id) => id !== itemId);
  };

  /**
   * (bryzZz)
   * Подписка на показ части туториала.
   * Нужна чтобы уведомить нужную часть что можно показывать
   */
  onAvailableToShow = (itemId: string, subscriber: () => void) => {
    this.subscribers.set(itemId, subscriber);

    return () => {
      this.subscribers.delete(itemId);
    };
  };

  /**
   * (bryzZz)
   * Эта функция когда часть туториала была показана
   */
  onClose = (itemId: string) => {
    this.pendingQueue = this.pendingQueue.filter((id) => id !== itemId);

    this.items[itemId] = { ...this.items[itemId], showed: true };
    this.reactDataListeners.get(itemId)?.forEach((l) => l());

    if (this.pendingQueue.length > 0) {
      this.emitShow(this.pendingQueue[0]);
    }
  };
}
