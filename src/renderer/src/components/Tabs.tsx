import { twMerge } from 'tailwind-merge';
import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';
import { useEffect, useState } from 'react';
import { CodeEditor } from './CodeEditor';

export interface TabData {
  tab: string;
  content: JSX.Element;
  cantClose?: boolean;
}

export interface TabsProps {
  tabsItems: TabData[];
  tabData: { name: string; code: string } | null;
  setTabData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      code: string;
    } | null>
  >;
}

export const Tabs: React.FC<TabsProps> = (props: TabsProps) => {
  /** Функция выбора вкладки (машина состояний, код) */
  const [activeTab, setActiveTab] = useState<number | 0>(0);
  const isActive = (index: number) => setActiveTab(index);
  const [tabsNewItems, setTabsNewItems] = useState<TabData[]>([]);
  const tabs = [...props.tabsItems, ...tabsNewItems];
  const codeShow = (name, code) => {
    if (name !== null && code !== null) {
      const trueTab = tabsNewItems.find((item) => item.tab === name);
      if (trueTab === undefined) {
        setTabsNewItems([
          ...tabsNewItems,
          {
            tab: name,
            content: <CodeEditor value={code} />,
          },
        ]);
        isActive(tabs.length);
        props.setTabData(null);
      }
    }
  };
  codeShow(props.tabData?.name, props.tabData?.code);

  //Функция закрытия вкладки (РАБОЧАЯ)
  const onClose = (id: number) => {
    console.log(id);
    console.log(tabsNewItems);
    tabsNewItems.splice(id - 2, 1);
    isActive(0);
  };

  return (
    <>
      <section className="flex">
        {tabs.map((name, id) => (
          <div
            key={'tab' + id}
            className={twMerge(
              'flex items-center p-1 hover:bg-[#4391BF] hover:bg-opacity-50',
              activeTab === id && 'border-t-2 border-t-[#4391BF] border-opacity-50'
            )}
          >
            <div role="button" onClick={() => isActive(id)} className="line-clamp-1 p-1">
              {name.tab}
            </div>
            {!name.cantClose ? (
              <button onClick={() => onClose(id)} className="p-1 hover:bg-[#FFFFFF]">
                <Close width="1rem" height="1rem" />
              </button>
            ) : (
              ''
            )}
          </div>
        ))}
      </section>
      {tabs.map((name, id) => (
        <div
          key={id + 'ActiveBlock'}
          className={twMerge('hidden h-[calc(100vh-2rem)]', activeTab === id && 'block')}
        >
          {name.content}
        </div>
      ))}
    </>
  );
};
