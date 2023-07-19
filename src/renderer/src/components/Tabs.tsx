import React from 'react';
import { twMerge } from 'tailwind-merge';
import close from '@renderer/assets/icons/close.svg';

interface TabsProps {
  functionTabs: (index) => void;
  fileName: string | null;
  isActive: (index) => boolean;
}

export const Tabs: React.FC<TabsProps> = ({ fileName, functionTabs, isActive }) => {
  const TabsItems = [
    {
      Tab: 'SM: ' + fileName,
    },
    {
      Tab: 'CODE: ' + fileName,
    },
  ];

  return (
    <>
      <div key="DivTabs" className="flex text-ellipsis">
        {TabsItems.map(({ Tab }, index) => (
          <button
            key={'Tab' + index}
            className={twMerge(
              'flex  px-2 py-1 font-Fira text-base',
              isActive(index) && 'bg-[#4391BF] bg-opacity-50'
            )}
            onClick={() => functionTabs(index)}
          >
            {Tab}
            {/*<img src={close} alt="" />*/}
          </button>
        ))}
      </div>
    </>
  );
};
