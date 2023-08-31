import { useState } from 'react';

import { CodeTab, Tab } from '@renderer/types/tabs';

export const useTabs = () => {
  const [tabItems, setTabItems] = useState<Tab[]>([{ type: 'editor', name: 'editor' }]);
  const [activeTab, setActiveTab] = useState('editor');

  const onCodeSnippet = (data: CodeTab) => {
    // Если пытаемся открыть одну и ту же вкладку
    if (tabItems.find((tab) => tab.name === data.name)) {
      return setActiveTab(data.name);
    }

    setTabItems((p) => [...p, data]);
    setActiveTab(data.name);
  };

  const handleCloseTab = (tabName: string) => {
    const closedTabIndex = tabItems.findIndex((tab) => tab.name === tabName);
    const activeTabIndex = tabItems.findIndex((tab) => tab.name === activeTab);

    // Если закрываемая вкладка была текущей то открываем вкладку которая была перед ней
    if (closedTabIndex === activeTabIndex) {
      setActiveTab(tabItems[activeTabIndex - 1].name);
    }

    setTabItems((p) => p.filter((tab) => tab.name !== tabName));
  };

  const handleSwapTabs = (a: string, b: string) => {
    setTabItems((p) => {
      const data = [...p];

      const aIndex = data.findIndex(({ name }) => name === a);
      const bIndex = data.findIndex(({ name }) => name === b);

      data.splice(bIndex, 0, data.splice(aIndex, 1)[0]);

      return data;
    });
  };

  const clearTabs = () => {
    setTabItems([{ type: 'editor', name: 'editor' }]);
    setActiveTab('editor');
  };

  return {
    tabItems,
    activeTab,
    setActiveTab,
    onCodeSnippet,
    handleCloseTab,
    handleSwapTabs,
    clearTabs,
  };
};
