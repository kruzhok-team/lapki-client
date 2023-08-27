import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as EditorIcon } from '@renderer/assets/icons/editor.svg';
import { ReactComponent as CodeIcon } from '@renderer/assets/icons/code.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';

import { CodeEditor } from './CodeEditor';
import { DiagramEditor, DiagramEditorProps } from './DiagramEditor';
import { Tab } from '@renderer/types/tabs';

const TabIcon = {
  editor: <EditorIcon />,
  code: <CodeIcon />,
  transition: <TransitionIcon />,
  state: <StateIcon />,
};

export interface TabsProps {
  editorProps: DiagramEditorProps;
  items: Tab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: (tabName: string) => void;
  onSwapTabs: (a: string, b: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  editorProps,
  items,
  activeTab,
  setActiveTab,
  onClose,
  onSwapTabs,
}: TabsProps) => {
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrag = (tabName: string) => {
    setDragId(tabName);
  };

  const handleDrop = (tabName: string) => {
    if (tabName === 'editor' || !dragId) return;

    onSwapTabs(dragId, tabName);
  };

  return (
    <>
      <section className="flex gap-1 overflow-x-auto break-words border-b border-border-primary bg-bg-secondary px-1 py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#a1c8df]">
        {items.map(({ name, type }) => (
          <button
            key={name}
            draggable={true}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => handleDrag(name)}
            onDrop={() => handleDrop(name)}
            className={twMerge(
              'group flex cursor-pointer items-center rounded p-1 px-2 transition hover:bg-bg-primary',
              activeTab === name && 'bg-bg-primary'
            )}
            onMouseDown={() => setActiveTab(name)}
          >
            {TabIcon[type]}

            {type !== 'editor' && (
              <span title={name} className="ml-1 line-clamp-1 w-20 text-left">
                {name}
              </span>
            )}

            {type !== 'editor' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(name);
                }}
                className={twMerge(
                  'hover:bg-bg-btn rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100',
                  activeTab === name && 'opacity-100'
                )}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </button>
        ))}
      </section>

      {items.map((item) => (
        <div
          key={item.name}
          className={twMerge('hidden h-[calc(100vh-2rem)]', activeTab === item.name && 'block')}
        >
          {item.type === 'editor' ? (
            <DiagramEditor {...editorProps} />
          ) : (
            <CodeEditor language={item.language} value={item.code} />
          )}
        </div>
      ))}
    </>
  );
};
