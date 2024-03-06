import { create } from 'zustand';

interface TutorialItem {
  id: string;
  title: string;
  content: string;
}

interface TutorialState {
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;

  items: TutorialItem[];
  currentItemId: string | null;
  setItems: (items: TutorialItem[]) => void;

  next: () => void;
}

export const useTutorial = create<TutorialState>((set) => ({
  disabled: false,
  setDisabled: (disabled) => set({ disabled }),

  items: [],
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
}));
