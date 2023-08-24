import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { ReactComponent as CodeIcon } from '@renderer/assets/icons/code.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow.svg';
import { CodeEditor } from './CodeEditor';
import { Documentations } from './Documentation/Documentation';
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
  tabData: TabDataAdd | null;
  setTabData: React.Dispatch<React.SetStateAction<TabDataAdd | null>>;
}

export const Tabs: React.FC<TabsProps> = (props: TabsProps) => {
  /** Функция выбора вкладки (машина состояний, код) */
  const [activeTab, setActiveTab] = useState<number | 0>(0);
  const isActive = (index: number) => setActiveTab(index);
  const [tabsNewItems, setTabsNewItems] = useState<TabData[]>([]);
  const tabs = [...props.tabsItems, ...tabsNewItems];

  const [isDocOpen, setIsDocOpen] = useState(false);

  useEffect(() => {
    if (props.tabData !== null) {
      const trueTab = tabs.find((item) => item.tab === props.tabData?.name);
      if (trueTab === undefined) {
        setTabsNewItems([
          ...tabsNewItems,
          {
            svgIcon:
              props.tabData.type === 'code' ? (
                <CodeIcon />
              ) : props.tabData.type === 'transition' ? (
                <TransitionIcon />
              ) : (
                <StateIcon />
              ),
            tab: props.tabData.name,
            content: <CodeEditor language={props.tabData.language} value={props.tabData.code} />,
          },
        ]);
        isActive(tabs.length);
        props.setTabData(null);
      } else {
        tabs.forEach((value, id) => {
          trueTab.tab !== value.tab || isActive(id);
        });
      }
    }
  }, [props.tabData, theme]);

  const onClose = (id: number) => {
    setTabsNewItems(tabsNewItems.filter((_value, index) => index !== id - 1));
    console.log(activeTab);
    isActive(0);
  };
  return (
    <>
      <section className="flex gap-1 overflow-x-auto break-words border-b border-border-primary bg-bg-secondary px-1 py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#a1c8df]">
        {tabs.map(({ svgIcon, tab, canClose = true }, id) => (
          <button
            key={id}
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
                  'rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-btn',
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
          className={twMerge('relative hidden h-[calc(100vh-2rem)]', activeTab === id && 'block')}
        >
          {value.content}

          <div
            className={twMerge(
              'absolute right-0 top-0 flex h-full translate-x-[calc(100%-2rem)] bg-bg-secondary transition-transform',
              isDocOpen && 'translate-x-0'
            )}
          >
            <button className="w-8" onClick={() => setIsDocOpen((p) => !p)}>
              <Arrow
                className={twMerge('rotate-180 transition-transform', isDocOpen && 'rotate-0')}
              />
            </button>

            <div className="w-[400px]">
              <Documentations baseUrl={'https://lapki-doc.polyus-nt.ru/'} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
