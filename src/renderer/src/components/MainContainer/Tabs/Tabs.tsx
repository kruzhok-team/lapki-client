import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { CodeEditor, DiagramEditor } from '@renderer/components';
import { ManagerMSTab } from '@renderer/components/ManagerMS';
import { SerialMonitorTab } from '@renderer/components/SerialMonitor';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { Tab as TabType } from '@renderer/types/tabs';

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

  if (items.length === 0) {
    return <NotInitialized />;
  }

  const selectTab = (item: TabType) => {
    switch (item.type) {
      case 'editor':
        // Вкладки удаляются только после удаления контроллеров.
        // И до удаления вкладок вызывается ререндер, вызывающий эту функцию
        if (!modelController.controllers[item.canvasId]) return undefined;
        return (
          <DiagramEditor
            controller={modelController.controllers[item.canvasId]}
            editor={modelController.controllers[item.canvasId].app}
          />
        );
      case 'transition':
      case 'state':
      case 'code':
        return <CodeEditor initialValue={item.code} language={item.language} />;
      case 'serialMonitor':
        return <SerialMonitorTab />;
      case 'managerMS':
        return <ManagerMSTab />;
      default:
        return undefined;
    }
  };

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
              closeTab(tab.name, modelController);
            }}
          />
        ))}
      </section>

      {items.map((item) => (
        <div
          key={item.name}
          className={twMerge('hidden h-[calc(100vh-44.19px)]', activeTab === item.name && 'block')}
        >
          {selectTab(item)}
        </div>
      ))}
    </>
  );
};
