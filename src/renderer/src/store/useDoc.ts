import { create } from 'zustand';

export type RightSidebarView = 'documentation' | 'tasks';

interface DocState {
  isOpen: boolean;
  visibleViews: Record<RightSidebarView, boolean>;
  mountedViews: Record<RightSidebarView, boolean>;
  onDocumentationToggle: () => void;
  onTasksToggle: () => void;
  closeView: (view: RightSidebarView) => void;
  toggleOpen: () => void;
}

const toggleView =
  (view: RightSidebarView) =>
  (state: DocState): Partial<DocState> => {
    const shouldShow = !state.isOpen || !state.visibleViews[view];

    return {
      isOpen: true,
      visibleViews: { ...state.visibleViews, [view]: shouldShow },
      mountedViews: { ...state.mountedViews, [view]: true },
    };
  };

export const useDoc = create<DocState>((set) => ({
  isOpen: false,
  visibleViews: { documentation: false, tasks: false },
  mountedViews: { documentation: false, tasks: false },
  onDocumentationToggle: () => set(toggleView('documentation')),
  onTasksToggle: () => set(toggleView('tasks')),
  closeView: (view) =>
    set((state) => {
      const visibleViews = { ...state.visibleViews, [view]: false };

      return {
        isOpen: Object.values(visibleViews).some(Boolean),
        visibleViews,
      };
    }),
  toggleOpen: () => set(({ isOpen }) => ({ isOpen: !isOpen })),
}));
