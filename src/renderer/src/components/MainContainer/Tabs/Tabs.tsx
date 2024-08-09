import { useState } from 'react';

import { useTabs } from '@renderer/store/useTabs';

import { Tab } from './Tab';
import { TabPanel } from './TabPanel';

import { NotInitialized } from '../NotInitialized';

export const Tabs: React.FC = () => {
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
    if (!dragId || dragId === 'editor' || dragId === 'scheme') return;

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
        {items.map(({ type, name }) => (
          <Tab
            key={name}
            isActive={activeTab === name}
            isDragging={dragId === name}
            draggable={type !== 'editor' && type !== 'scheme'}
            type={type}
            name={name}
            showName={type !== 'editor'}
            onDragStart={() => handleDrag(name)}
            onDrop={() => handleDrop(name)}
            onMouseDown={() => setActiveTab(name)}
            onClose={() => closeTab(name)}
          />
        ))}
      </section>

      <TabPanel activeTab={activeTab} items={items} />
    </>
  );
};
