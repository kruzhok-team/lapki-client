import React from 'react';
import { twMerge } from 'tailwind-merge';
import close from '@renderer/assets/img/close.png';

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
    {
      Tab: <img src={close} alt="" />,
    },
  ];

  return (
    <>
      <div key="DivTabs" className="flex">
        {TabsItems.map(({ Tab }, index) => (
          <button
            key={'Tab' + index}
            className={twMerge(
              'px-1 py-1 font-Fira text-base',
              isActive(index) && 'bg-[#4391BF] bg-opacity-50'
            )}
            onClick={() => functionTabs(index)}
          >
            {Tab}
          </button>
        ))}
      </div>
    </>
  );
};
