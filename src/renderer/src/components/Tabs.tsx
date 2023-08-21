import { twMerge } from 'tailwind-merge';

import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { ReactComponent as CodeIcon } from '@renderer/assets/icons/code.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { useEffect, useState } from 'react';
import { CodeEditor } from './CodeEditor';

export interface TabData {
  svgIcon?: JSX.Element;
  tab?: string;
  content: JSX.Element;
  cantClose?: boolean;
}

export interface TabDataAdd {
  type: string;
  name: string;
  code: string;
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
            content: <CodeEditor value={props.tabData.code} />,
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
  }, [props.tabData]);

  const onClose = (id: number) => {
    setTabsNewItems(tabsNewItems.filter((_value, index) => index !== id - 1));
    console.log(activeTab);
    isActive(0);
  };
  return (
    <>
      <section
        className={twMerge(
          'flex gap-1 overflow-x-auto break-words px-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#a1c8df]'
        )}
      >
        {tabs.map(({ svgIcon, tab, cantClose }, id) => (
          <div
            key={'tab' + id}
            className={twMerge(
              'group/item my-1 flex items-center rounded-full bg-[#d6d6d6] hover:rounded-full hover:bg-[#a1c8df]',
              activeTab === id && 'rounded-full bg-[#a1c8df]'
            )}
          >
            {/*Если захотите увеличить или убавить размер вкладок, то в родительском стиле +/- px-i, а у текста +/- m-i*/}
            <div className="flex items-center px-1" role="button" onClick={() => isActive(id)}>
              <div className="m-1">{svgIcon}</div>
              <div className={twMerge('m-1 line-clamp-1 w-20', id === 0 && 'hidden')}>{tab}</div>
            </div>
            {!cantClose ? (
              <button
                onClick={() => onClose(id)}
                className={twMerge(
                  'hover:rounder-[1rem] invisible mr-1 rounded-full p-1 group-hover/item:visible hover:bg-[#FFF]',
                  activeTab === id && 'visible'
                )}
              >
                <CloseIcon />
              </button>
            ) : (
              ''
            )}
          </div>
        ))}
      </section>
      {tabs.map((value, id) => (
        <div
          key={id + 'ActiveBlock'}
          className={twMerge('hidden h-[calc(100vh-2rem)]', activeTab === id && 'block')}
        >
          {value.content}
        </div>
      ))}
    </>
  );
};
