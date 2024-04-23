import { create } from 'zustand';

interface DocState {
  isOpen: boolean;
  toggle: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const useDoc = create<DocState>((set) => ({
  isOpen: false,
  toggle: () => set(({ isOpen }) => ({ isOpen: !isOpen })),
  isCollapsed: false,
  setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
}));
