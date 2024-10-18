import { create } from 'zustand';

export enum SidebarIndex {
  Menu,
  Explorer,
  StateMachineList,
  Compiler,
  Flasher,
  History,
  Settings,
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
