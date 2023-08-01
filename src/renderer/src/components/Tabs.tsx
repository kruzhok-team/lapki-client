import React from 'react';
import { twMerge } from 'tailwind-merge';
import '../index.css';

import { ReactComponent as Cross } from '@renderer/assets/icons/cross.svg';
interface TabsProps {
  functionTabs: (index) => void;
  fileName: string | null;
  isActive: (index) => boolean;
}

export const Tabs: React.FC<TabsProps> = ({ fileName, functionTabs, isActive }) => {
  const TabsItems = [
    {
      tab: 'SM: ' + fileName,
    },
    {
      tab: 'CODE: ' + fileName,
    },
  ];

  return (
    <>
      <div className="flex font-Fira">
        {TabsItems.map(({ tab }, index) => (
          <div
            key={'tab' + index}
            className={twMerge(
              'flex items-center',
              isActive(index) && 'bg-[#4391BF] bg-opacity-50'
            )}
            onClick={() => functionTabs(index)}
          >
            <div role="button" className="line-clamp-1 p-1">
              {tab}
            </div>
            <button className="p-2 hover:bg-[#FFFFFF]">
              <Cross width="1rem" height="1rem" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
