import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { CodeEditor, DiagramEditor } from '@renderer/components';
import { SerialMonitorTab } from '@renderer/components/SerialMonitor';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';

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
          {item.type === 'editor' ? (
            <DiagramEditor
              editor={
                (modelController.controllers[item.canvasId] ?? modelController.controllers['']).app
              }
              controller={
                modelController.controllers[item.canvasId] ?? modelController.controllers['']
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
