import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { CodeEditor, DiagramEditor, Explorer, Documentations, Menu, Tabs } from '../components';

import menu from '../img/menu.png';
import components1 from '../img/components1.png';
import programming from '../img/programming.png';
import drive1 from '../img/flash-drive1.png';
import chip1 from '../img/chip1.png';
import gear1 from '../img/gear1.png';

interface SidebarProps {
  onRequestOpenFile: () => void;
  fileContent: string | null;
}

const items = [
  {
    imgSrc: menu,
  },
  {
    imgSrc: components1,
  },
  {
    imgSrc: programming,
  },
  {
    imgSrc: drive1,
  },
  {
    imgSrc: chip1,
  },
  {
    imgSrc: gear1,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ fileContent, onRequestOpenFile }) => {
  const [activeTab, setActiveTab] = useState<number | null>(null);

  const handleClick = (index: number) => () => {
    if (activeTab === index) {
      return setActiveTab(null);
    }

    setActiveTab(index);
  };
  const isActive = (index: number) => activeTab === index;

  const tabs = [
    <Menu onRequestOpenFile={onRequestOpenFile} />,
    <Explorer />,
    <CodeEditor value={fileContent ?? ''} />,
  ];

  return (
    <aside className="flex">
      <div className="flex flex-col gap-2 p-2">
        {items.map(({ imgSrc }, index) => (
          <button
            className={twMerge(
              'w-[2rem] last:justify-self-end',
              isActive(index) && 'bg-[#4391BF] bg-opacity-50'
            )}
            onClick={handleClick(index)}
          >
            <img src={imgSrc} alt="" />
          </button>
        ))}
      </div>

      <div className={twMerge('w-72', activeTab === null && 'hidden')}>
        {tabs.map((Element, i) => (
          <div className={twMerge('hidden', isActive(i) && 'block')}>{Element}</div>
        ))}
      </div>
    </aside>
  );
};
