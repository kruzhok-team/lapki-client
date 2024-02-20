import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { CodeEditor, DiagramEditor, DiagramEditorProps } from '@renderer/components';
import { useTabs } from '@renderer/store/useTabs';

import { Tab } from './Tab';

export type TabsProps = DiagramEditorProps;

export const Tabs: React.FC<TabsProps> = (editorProps: TabsProps) => {
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
            draggable={type !== 'editor'}
            type={type}
            name={name}
            showName={type !== 'editor'}
            canClose={type !== 'editor'}
            onDragStart={() => handleDrag(name)}
            onDrop={() => handleDrop(name)}
            onMouseDown={() => setActiveTab(name)}
            onClose={() => closeTab(name)}
          />
        ))}
      </section>

      {items.map((item) => (
        <div
          key={item.name}
          className={twMerge('hidden h-[calc(100vh-44.19px)]', activeTab === item.name && 'block')}
        >
          {item.type === 'editor' ? (
            <DiagramEditor {...editorProps} />
          ) : (
            <CodeEditor initialValue={item.code} language={item.language} />
          )}
        </div>
      ))}
    </>
  );
};
