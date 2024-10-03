import { create } from 'zustand';

import { Tab } from '@renderer/types/tabs';

interface TabsState {
  items: Tab[];
  activeTab: string | null;
  setActiveTab: (tabName: string) => void;
  openTab: (tab: Tab) => void;
  closeTab: (tabName: string) => void;
  swapTabs: (a: string, b: string) => void;
  clearTabs: () => void;
}

export const useTabs = create<TabsState>((set) => ({
  items: [],
  activeTab: 'editor',
  setActiveTab: (activeTab) => {
    set({ activeTab });
  },
  openTab: (tab) =>
    set(({ items }) => {
      // Если пытаемся открыть одну и ту же вкладку
      if (items.find(({ name }) => name === tab.name)) {
        return { activeTab: tab.name };
      }

      return {
        items: [...items, tab],
        activeTab: tab.name,
      };
    }),
  closeTab: (tabName) =>
    set(({ items, activeTab }) => {
      const closedTabIndex = items.findIndex((tab) => tab.name === tabName);
      const activeTabIndex = items.findIndex((tab) => tab.name === activeTab);
      const newItems = items.filter((tab) => tab.name !== tabName);

      if (newItems.length === 0) {
        return {
          items: newItems,
          activeTab: null,
        };
      }

      let newActiveTab = activeTab;

      // Если закрываемая вкладка была текущей то открываем вкладку которая была перед ней
      // TODO: Менять текущий главный канвас при закрытии вкладки
      if (closedTabIndex === activeTabIndex) {
        if (closedTabIndex === items.length - 1) {
          newActiveTab = newItems[newItems.length - 1].name;
        } else {
          newActiveTab = newItems[closedTabIndex].name;
        }
      }

      return {
        items: newItems,
        activeTab: newActiveTab,
      };
    }),
  swapTabs: (a, b) =>
    set(({ items }) => {
      const data = [...items];

      const aIndex = items.findIndex(({ name }) => name === a);
      const bIndex = items.findIndex(({ name }) => name === b);

      data.splice(bIndex, 0, data.splice(aIndex, 1)[0]);

      return {
        items: data,
      };
    }),
  clearTabs: () =>
    set(() => ({
      items: [],
      activeTab: null,
    })),
}));
