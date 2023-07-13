import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { Explorer, Menu } from '../components';

import menu from '../assets/img/menu.png';
import components from '../assets/img/components1.png';
import drive from '../assets/img/flash-drive.png';
import chip from '../assets/img/chip.png';
import gear from '../assets/img/gear.png';

interface SidebarProps {
  onRequestOpenFile: () => void;
}

const items = [
  {
    imgSrc: menu,
  },
  {
    imgSrc: components,
  },
  {
    imgSrc: drive,
  },
  {
    imgSrc: chip,
  },
  {
    imgSrc: gear,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onRequestOpenFile }) => {
  const [activeTab, setActiveTab] = useState<number | null>(null);

  const handleClick = (index: number) => () => {
    if (activeTab === index) {
      return setActiveTab(null);
    }

    setActiveTab(index);
  };
  const isActive = (index: number) => activeTab === index;

  const tabs = [<Menu onRequestOpenFile={onRequestOpenFile} />, <Explorer />];

  return (
    <aside className="flex">
      <div key="ButtonImg" className="flex flex-col gap-2 p-2">
        {items.map(({ imgSrc }, index) => (
          <button
            key={index + 'button'}
            className={twMerge('w-[2rem]', isActive(index) && '')}
            onClick={handleClick(index)}
          >
            <img src={imgSrc} alt="" />
          </button>
        ))}
      </div>

      <div key="DivElements" className={twMerge('w-56', activeTab === null && 'hidden')}>
        {tabs.map((Element, i) => (
          <div key={i + 'DivElement'} className={twMerge('hidden h-full', isActive(i) && 'block')}>
            {Element}
          </div>
        ))}
      </div>
    </aside>
  );
};
