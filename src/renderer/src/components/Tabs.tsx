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
  const [tabs, setTabs] = useState<TabData[]>([...props.tabsItems]);

  const codeShow = (name, code) => {
    if (name !== undefined && code !== undefined) {
      const trueTab = tabs.find((item) => item.tab === name);
      if (trueTab === undefined) {
        setTabs([
          ...tabs,
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
    tabs.splice(id, 1);
    isActive(0);
  };

  return (
    <>
      <section className="flex">
        {tabs.map((value, id) => (
          <div
            key={'tab' + id}
            className={twMerge(
              'box-border flex items-center border-t-2 border-t-[#FFF] p-1 hover:border-t-[#4391BF] hover:border-opacity-50',
              activeTab === id && ' border-t-[#4391BF] border-opacity-50'
            )}
          >
            <div role="button" onClick={() => isActive(id)} className="line-clamp-1 p-1">
              {value.tab}
            </div>
            {!value.cantClose ? (
              <button onClick={() => onClose(id)} className="p-1 hover:bg-[#FFFFFF]">
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
