import React, { useMemo, useState, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { Panel, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';

import { Explorer, Menu, MenuProps } from '../components';

import menu from '../assets/img/menu.png';
import compiler from '../assets/img/forward.png';
import components from '../assets/img/components.png';
import drive from '../assets/img/flash-drive.png';
import chip from '../assets/img/chip.png';
import gear from '../assets/img/gear.png';
import { StateMachine } from '@renderer/lib/data/StateMachine';
interface SidebarProps {
  menuProps: MenuProps,
  stateMachine: StateMachine | undefined;
}

const items = [
  {
    imgSrc: menu,
  },

  {
    imgSrc: components,
  },
  {
    imgSrc: compiler,
  },
  {
    imgSrc: drive,
  },
  {
    imgSrc: chip,
  },
  {
    imgSrc: gear,
    style: true,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ stateMachine, menuProps }) => {
  const panelRef = useRef<ImperativePanelHandle>(null);

  const [activeTab, setActiveTab] = useState(0);

  const handleClick = (i: number) => () => {
    const panel = panelRef.current;

    if (i === activeTab && panel) {
      if (panel.getCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }

      return;
    }

    setActiveTab(i);
  };

  const tabs = useMemo(
    () => [
      <Menu {...menuProps} />,
      <Explorer stateMachine={stateMachine}/>,
    ],
    [stateMachine]
  );

  return (
    <>
      <div className="flex flex-col gap-2 p-2">
        {items.map(({ imgSrc, style }, i) => (
          <button key={i} className={twMerge('w-8', style && 'mt-auto')} onClick={handleClick(i)}>
            <img src={imgSrc} alt="" className="pointer-events-none" />
          </button>
        ))}
      </div>

      <Panel collapsible={true} minSize={20} defaultSize={20} ref={panelRef}>
        <div className="h-full w-full">
          {tabs.map((Element, i) => (
            <div key={i} className={twMerge('hidden h-full', i === activeTab && 'block')}>
              {Element}
            </div>
          ))}
        </div>
      </Panel>

      <PanelResizeHandle className="group">
        <div className="h-full w-1 bg-[#4391BF] bg-opacity-50 transition-colors group-hover:bg-opacity-100 group-data-[resize-handle-active]:bg-opacity-100" />
      </PanelResizeHandle>
    </>
  );
};
