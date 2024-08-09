import React from 'react';

import { twMerge } from 'tailwind-merge';

import { CodeEditor, DiagramEditor, SchemeEditor } from '@renderer/components';
import { Tab } from '@renderer/types/tabs';

interface TabPanelProps {
  activeTab: string | null;
  items: Tab[];
}

export const TabPanel: React.FC<TabPanelProps> = ({ activeTab, items }) => {
  return (
    <>
      {items.map((item) => (
        <div
          key={item.name}
          className={twMerge('hidden h-[calc(100vh-44.19px)]', activeTab === item.name && 'block')}
        >
          {item.type === 'editor' ? (
            <DiagramEditor />
          ) : item.type === 'scheme' ? (
            <SchemeEditor />
          ) : (
            <CodeEditor initialValue={item.code} language={item.language} />
          )}
        </div>
      ))}
    </>
  );
};
