import React, { useEffect, useState } from 'react';

import { Resizable } from 're-resizable';
import { twMerge } from 'tailwind-merge';

import { useSidebar } from '@renderer/store/useSidebar';

interface MenusProps {
  items: React.ReactNode[];
}

export const Menus: React.FC<MenusProps> = ({ items }) => {
  const [activeTab, isCollapsed, setIsCollapsed] = useSidebar((state) => [
    state.activeTab,
    state.isCollapsed,
    state.setIsCollapsed,
  ]);

  const [width, setWidth] = useState(260);
  const [minWidth, setMinWidth] = useState(260);
  const [maxWidth, setMaxWidth] = useState('80vw');

  const handleResize = (e) => {
    if (e.pageX < 100 && !isCollapsed) {
      setIsCollapsed(true);
    }

    if (e.pageX >= 100 && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const handleResizeStop = (d) => {
    setWidth(width + d.width);
  };

  useEffect(() => {
    if (isCollapsed) {
      setMaxWidth('5px');
      setMinWidth(5);
    } else {
      setMaxWidth('80vw');
      setMinWidth(260);
    }
  }, [isCollapsed]);

  return (
    <Resizable
      enable={{ right: true }}
      size={{ width: width, height: '100vh' }}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      className="z-50 overflow-hidden border-r border-border-primary bg-bg-secondary"
    >
      <div
        className={twMerge(
          'h-full w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb',
          isCollapsed && 'opacity-0'
        )}
      >
        {items.map((Element, i) => (
          <div key={i} className={twMerge('hidden h-full', i === activeTab && 'block')}>
            {Element}
          </div>
        ))}
      </div>
    </Resizable>
  );
};
