import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { ReactComponent as CodeIcon } from '@renderer/assets/icons/code.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';

import { CodeEditor } from './CodeEditor';
import theme from '@renderer/theme';

export interface TabData {
  svgIcon?: JSX.Element;
  tab?: string;
  content: JSX.Element;
  canClose?: boolean;
}

export interface TabDataAdd {
  type: string;
  name: string;
  code: string;
  language: string;
}

export interface TabsProps {
  tabsItems: TabData[];
  tabData: TabDataAdd[] | null;
  setTabData: React.Dispatch<React.SetStateAction<TabDataAdd[] | null>>;
}

export const Tabs: React.FC<TabsProps> = (props: TabsProps) => {
  /** Функция выбора вкладки (машина состояний, код) */
  const [activeTab, setActiveTab] = useState<number | 0>(0);
  const isActive = (index: number) => setActiveTab(index);
  const [tabsNewItems, setTabsNewItems] = useState<TabData[]>([]);
  const tabs = [...props.tabsItems, ...tabsNewItems];

  useEffect(() => {
    if (props.tabData !== null) {
      const newTabs = new Array<TabData>();
      props.tabData.map((tab, _id) => {
        const trueTab = tabs.find((item) => item.tab === tab.name);
        if (trueTab === undefined) {
          newTabs.push({
            svgIcon:
              tab.type === 'code' ? (
                <CodeIcon />
              ) : tab.type === 'transition' ? (
                <TransitionIcon />
              ) : (
                <StateIcon />
              ),
            tab: tab.name,
            content: <CodeEditor language={tab.language} value={tab.code} />,
          });
          isActive(tabs.length);
        } else {
          tabs.forEach((value, id) => {
            trueTab.tab !== value.tab || isActive(id);
          });
        }
      });
      setTabsNewItems([...tabsNewItems, ...newTabs]);
      props.setTabData(null);
    }
  }, [props.tabData, theme]);

  const onClose = (id: number) => {
    setTabsNewItems(tabsNewItems.filter((_value, index) => index !== id - 1));
    isActive(0);
  };

  //Ниже реализовано перетаскивание вкладок между собой
  const [dragId, setDragId] = useState();

  const handleDrag = (id) => {
    setDragId(id);
    console.log(id);
  };

  const handleDrop = (id) => {
    if (id !== -1) {
      const dragBox = tabsNewItems.find((_box, index) => index === dragId);
      const dropBox = tabsNewItems.find((_box, index) => index === id);

      const dragBoxOrder = dragBox;
      const dropBoxOrder = dropBox;

      const newBoxState = tabsNewItems.map((box, index) => {
        if (index === dragId) {
          box = dropBoxOrder!;
        }
        if (index === id) {
          box = dragBoxOrder!;
        }
        isActive(id + 1);
        return box;
      });
      setTabsNewItems(newBoxState);
    }
  };

  return (
    <>
      <section className="flex gap-1 overflow-x-auto break-words border-b border-border-primary bg-bg-secondary px-1 py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#a1c8df]">
        {tabs.map(({ svgIcon, tab, canClose = true }, id) => (
          <button
            key={id}
            draggable={true}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => handleDrag(id - 1)}
            onDrop={() => handleDrop(id - 1)}
            className={twMerge(
              'group flex cursor-pointer items-center rounded p-1 px-2 transition hover:bg-bg-primary',
              activeTab === id && 'bg-bg-primary'
            )}
            onClick={() => isActive(id)}
          >
            {svgIcon}

            <span
              title={tab}
              className={twMerge('ml-1 line-clamp-1 w-20 text-left', id === 0 && 'hidden')}
            >
              {tab}
            </span>

            {canClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(id);
                }}
                className={twMerge(
                  'hover:bg-bg-btn rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100',
                  activeTab === id && 'opacity-100'
                )}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </button>
        ))}
      </section>

      {tabs.map((value, id) => (
        <div
          key={id}
          className={twMerge('hidden h-[calc(100vh-2rem)]', activeTab === id && 'block')}
        >
          {value.content}
        </div>
      ))}
    </>
  );
};
