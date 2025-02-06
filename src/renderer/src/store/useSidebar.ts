import { create } from 'zustand';
// (Roundabout) TODO: поменять систему индексов
export enum SidebarIndex {
  Menu,
  StateMachineList,
  Explorer,
  Compiler,
  Flasher,
  History,
  Settings = 7, // 6-ой элемент - это документация, но она не является вкладкой
}

interface SidebarState {
  activeTab: SidebarIndex;
  isCollapsed: boolean;
  changeTab: (value: SidebarIndex) => void;
  setIsCollapsed: (value: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  activeTab: 0,
  isCollapsed: false,
  changeTab: (tab) =>
    set(({ activeTab, isCollapsed }) => {
      if (tab === activeTab) {
        return { isCollapsed: !isCollapsed };
      }

      return {
        activeTab: tab,
        isCollapsed: false,
      };
    }),
  setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
}));
