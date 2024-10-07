import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { CodeEditor, DiagramEditor } from '@renderer/components';
import { SerialMonitorTab } from '@renderer/components/SerialMonitor';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { Tab as TabData } from '@renderer/types/tabs';

import { Tab } from './Tab';

import { NotInitialized } from '../NotInitialized';

export const Tabs: React.FC = () => {
  const modelController = useModelContext();
  const [items, activeTab, setActiveTab, swapTabs, closeTab] = useTabs((state) => [
    state.items,
    state.activeTab,
    state.setActiveTab,
    state.swapTabs,
    state.closeTab,
  ]);

  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrag = (tabName: string) => {
    setDragId(tabName);
  };

  const handleDrop = (tabName: string) => {
    if (tabName === 'editor' || !dragId) return;

    swapTabs(dragId, tabName);
  };

  const changeHeadController = (items: TabData[], closedTab: TabData) => {
    const { name } = closedTab;
    const closedTabIndex = items.findIndex((tab) => tab.name === name);
    const activeTabIndex = items.findIndex((tab) => tab.name === activeTab);

    const newItems = items.filter((tab) => tab.name !== name);

    if (newItems.length === 0) {
      modelController.model.changeHeadControllerId('');
      return;
    }

    // Если закрываемая вкладка была текущей то открываем вкладку которая была перед ней
    // TODO: Менять текущий главный канвас при закрытии вкладки
    if (closedTabIndex === activeTabIndex) {
      if (closedTabIndex === items.length - 1) {
        const prevTab = newItems[newItems.length - 1];
        if (prevTab.type === 'editor') {
          modelController.model.changeHeadControllerId(prevTab.canvasId);
        }
      } else {
        const prevTab = newItems[closedTabIndex];
        if (prevTab.type === 'editor') {
          modelController.model.changeHeadControllerId(prevTab.canvasId);
        }
      }
    }
  };

  if (items.length === 0) {
    return <NotInitialized />;
  }

  return (
    <>
      <section
        className="flex gap-1 overflow-x-auto break-words border-b border-border-primary bg-bg-secondary px-1 py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current"
        tabIndex={-1}
      >
        {items.map((tab) => (
          <Tab
            key={tab.name}
            isActive={activeTab === tab.name}
            isDragging={dragId === tab.name}
            draggable={tab.type !== 'editor'}
            type={tab.type}
            name={tab.name}
            showName={true}
            onDragStart={() => handleDrag(tab.name)}
            onDrop={() => handleDrop(tab.name)}
            onMouseDown={() => {
              if (tab.type === 'editor') {
                modelController.model.changeHeadControllerId(tab.canvasId);
              }
              setActiveTab(tab.name);
            }}
            onClose={() => {
              changeHeadController(items, tab);
              closeTab(tab.name);
            }}
          />
        ))}
      </section>

      {items.map((item) => (
        <div
          key={item.name}
          className={twMerge('hidden h-[calc(100vh-44.19px)]', activeTab === item.name && 'block')}
        >
          {item.type === 'editor' ? (
            <DiagramEditor
              editor={
                modelController.controllers[item.canvasId]?.app ??
                modelController.controllers['']?.app
              }
            />
          ) : item.type === 'code' ? (
            <CodeEditor initialValue={item.code} language={item.language} />
          ) : (
            <SerialMonitorTab />
          )}
        </div>
      ))}
    </>
  );
};
