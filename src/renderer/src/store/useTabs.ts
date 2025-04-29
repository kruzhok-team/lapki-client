import { create } from 'zustand';

import { ModelController } from '@renderer/lib/data/ModelController';
import { Tab } from '@renderer/types/tabs';

interface TabsState {
  items: Tab[];
  activeTab: string | null;
  setActiveTab: (modelController: ModelController, tabName: string) => void;
  openTab: (modelController: ModelController, tab: Tab) => void;
  closeTab: (tabName: string, modelController: ModelController) => void;
  swapTabs: (a: string, b: string) => void;
  clearTabs: () => void;
  renameTab: (oldName: string, newName: string) => void;
  nextTab: () => void;
  prevTab: () => void;
}

export const useTabs = create<TabsState>((set) => ({
  items: [],
  activeTab: 'editor',
  setActiveTab: (modelController, activeTab) => {
    set(({ items }) => {
      const tab = items.find(({ name }) => name === activeTab);
      if (!tab) return {};
      if (tab.type === 'editor') {
        modelController.model.changeHeadControllerId(tab.canvasId);
      }
      return { activeTab: activeTab };
    });
  },
  openTab: (modelController, tab) =>
    set(({ items }) => {
      if (tab.type === 'editor') {
        modelController.model.changeHeadControllerId(tab.canvasId);
      }

      // Если пытаемся открыть одну и ту же вкладку
      if (items.find(({ name }) => name === tab.name)) {
        return { activeTab: tab.name };
      }

      return {
        items: [...items, tab],
        activeTab: tab.name,
      };
    }),
  // Передаем ModelController, чтобы он сам разобрался с тем, какой Controller в итоге будет главный
  closeTab: (tabName, modelController: ModelController) =>
    set(({ items, activeTab }) => {
      const closedTabIndex = items.findIndex((tab) => tab.name === tabName);
      const activeTabIndex = items.findIndex((tab) => tab.name === activeTab);
      const newItems = items.filter((tab) => tab.name !== tabName);

      if (newItems.length === 0) {
        modelController.model.changeHeadControllerId('');
        return {
          items: newItems,
          activeTab: null,
        };
      }

      let newActiveTabName = activeTab;

      // Если закрываемая вкладка была текущей то открываем вкладку которая была перед ней
      if (closedTabIndex === activeTabIndex) {
        if (closedTabIndex === items.length - 1) {
          newActiveTabName = newItems[newItems.length - 1].name;
        } else {
          newActiveTabName = newItems[closedTabIndex].name;
        }
      }

      if (newActiveTabName) {
        const newActiveTab = items[items.findIndex((tab) => tab.name === newActiveTabName)];
        if (newActiveTab.type === 'editor') {
          modelController.model.changeHeadControllerId(newActiveTab.canvasId);
        } else {
          modelController.model.changeHeadControllerId('');
        }
      }

      return {
        items: newItems,
        activeTab: newActiveTabName,
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
    set(() => {
      return {
        items: [],
        activeTab: null,
      };
    }),
  renameTab: (oldName, newName) =>
    set(({ items, activeTab }) => {
      const newItems = [...items];
      const index = newItems.findIndex(({ name }) => name === oldName);
      let newActiveTab = activeTab;
      if (index !== -1) {
        newItems[index].name = newName;

        newActiveTab = oldName == activeTab ? newName : activeTab;
      }

      return {
        items: newItems,
        activeTab: newActiveTab,
      };
    }),
  nextTab: () => {
    set(({ items, activeTab }) => {
      if (!activeTab)
        return {
          items,
          activeTab,
        };
      const newItems = [...items];
      let index = newItems.findIndex(({ name }) => name === activeTab);
      let newActiveTab = activeTab;
      if (index !== -1) {
        if (index === items.length - 1) {
          index = 0;
        } else {
          index += 1;
        }

        newActiveTab = items[index].name;
      }

      return {
        items: newItems,
        activeTab: newActiveTab,
      };
    });
  },
  prevTab: () => {
    set(({ items, activeTab }) => {
      if (!activeTab)
        return {
          items,
          activeTab,
        };
      const newItems = [...items];
      let index = newItems.findIndex(({ name }) => name === activeTab);
      let newActiveTab = activeTab;
      if (index !== -1) {
        if (index === 0) {
          index = items.length - 1;
        } else {
          index -= 1;
        }

        newActiveTab = items[index].name;
      }

      return {
        items: newItems,
        activeTab: newActiveTab,
      };
    });
  },
}));
