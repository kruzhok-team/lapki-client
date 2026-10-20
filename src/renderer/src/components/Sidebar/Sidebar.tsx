import React, { useState } from 'react';

import { Resizable } from 're-resizable';

import { Explorer } from './Explorer';

export const Sidebar: React.FC = () => {
  const [width, setWidth] = useState(232);

  return (
    <Resizable
      enable={{ right: true }}
      size={{ width, height: '100%' }}
      minWidth={200}
      maxWidth="80vw"
      onResizeStop={(_event, _direction, _element, delta) => setWidth(width + delta.width)}
      className="z-50 overflow-hidden rounded-r-2xl border-r border-border-primary bg-bg-secondary shadow-[2px_0_4px_rgba(0,0,0,0.25)] [[data-theme=light]_&]:bg-white"
    >
      <div className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        <Explorer />
      </div>
    </Resizable>
  );
};
