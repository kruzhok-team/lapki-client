import { create } from 'zustand';

interface TutorialItem {
  id: string;
  title: string;
  content: string;
}

type Subscriber = () => void;
type Unsubscribe = () => void;

interface TutorialState {
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;

  items: TutorialItem[];
  setItems: (items: TutorialItem[]) => void;

  requestShow: (itemId: string) => void;
  onAvailableToShow: (itemId: string, subscriber: Subscriber) => Unsubscribe;
  onClose: (itemId: string) => void;

  pendingQueue: string[];
  currentItemId: string | null;

  next: () => void;

  availableToShow: (itemId: string) => boolean;
}

export const useTutorial = create<TutorialState>((set) => ({
  disabled: false,
  setDisabled: (disabled) => set({ disabled }),

  items: [],
  pendingQueue: [],
  currentItemId: null,
  setItems: (items) => set({ items }),

  next: () =>
    set(({ currentItemId, items }) => {
      const currentItemIndex = items.findIndex((item) => item.id === currentItemId);

      if (currentItemIndex === -1 || currentItemIndex === items.length - 1) {
        return {
          currentItemId: null,
        };
      }

      const nextItemIndex = currentItemIndex + 1;

      return {
        currentItemId: items[nextItemIndex]?.id,
      };
    }),

  availableToShow: (itemId) => true,
}));
