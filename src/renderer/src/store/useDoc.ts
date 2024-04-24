import { create } from 'zustand';

interface DocState {
  isOpen: boolean;
  toggle: () => void;
}

export const useDoc = create<DocState>((set) => ({
  isOpen: false,
  toggle: () => set(({ isOpen }) => ({ isOpen: !isOpen })),
}));
