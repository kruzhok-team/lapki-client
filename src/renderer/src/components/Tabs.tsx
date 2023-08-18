import { twMerge } from 'tailwind-merge';
import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';
import { useEffect, useState } from 'react';
import { CodeEditor } from './CodeEditor';

export interface TabData {
  tab: string;
  content: JSX.Element;
  cantClose?: boolean;
}

export interface TabDataAdd {
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
            tab: props.tabData.name,
            content: <CodeEditor value={props.tabData.code} />,
          },
        ]);
        isActive(tabs.length);
      } else {
        tabs.forEach((value, id) => {
          console.log(trueTab.tab, value.tab);
          trueTab.tab !== value.tab || isActive(id);
        });
      }
    }
  }, [props.tabData]);

  const onClose = (id: number) => {
    console.log(id);
    setTabsNewItems((tabs) => tabs.splice(id, 1));
    isActive(0);
  };

  return (
    <>
      <section className="flex">
        {tabs.map((value, id) => (
          <div
            key={'tab' + id}
            className={twMerge(
              'flex items-center border-b-4 border-b-[#FFF] p-1 pb-[-10px] hover:border-b-[#4391BF] hover:border-opacity-50',
              activeTab === id && 'border-b-[#4391BF] border-opacity-50'
            )}
          >
            <div role="button" onClick={() => isActive(id)} className="line-clamp-1 px-1 pt-1">
              {value.tab}
            </div>
            {!value.cantClose ? (
              <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-[#4391BF] hover:bg-opacity-50 "
              >
                <Close width="1rem" height="1rem" />
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
