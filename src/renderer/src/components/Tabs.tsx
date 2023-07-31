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
    {
      tab: 'CODE: ' + 'jkfghdfkhdfgjkfchdkjsg',
    },
  ];

  return (
    <>
      <div key="DivTabs" className="flex max-w-full font-Fira">
        {TabsItems.map(({ tab }, index) => (
          <button
            key={'tab' + index}
            className={twMerge(
              'flex items-center px-1 py-1',
              isActive(index) && 'bg-[#4391BF] bg-opacity-50'
            )}
            onClick={() => functionTabs(index)}
          >
            <p className="w-auto truncate">{tab}</p>
            <button className="p-2 hover:bg-[#FFFFFF]">
              <Cross width="1rem" height="1rem" />
            </button>
          </button>
        ))}
      </div>
    </>
  );
};
