import { create } from 'zustand';

interface DocState {
  isOpen: boolean;
  onDocumentationToggle: () => void;
}

export const useDoc = create<DocState>((set) => ({
  isOpen: false,
  onDocumentationToggle: () => set(({ isOpen }) => ({ isOpen: !isOpen })),
}));
