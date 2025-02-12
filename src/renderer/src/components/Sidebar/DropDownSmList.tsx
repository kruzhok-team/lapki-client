import React from 'react';

import { twMerge } from 'tailwind-merge';

interface DropDownSmListProps {
  isSmDropDownOpen: boolean;
  setFloating: (node: HTMLElement | null) => void;
  floatingStyles: React.CSSProperties;
}

export const DropDownSmList: React.FC<DropDownSmListProps> = ({
  isSmDropDownOpen,
  setFloating,
  floatingStyles,
}) => {
  return (
    <div
      ref={setFloating}
      style={floatingStyles}
      className={twMerge('w-64 rounded bg-white p-2 shadow-xl', !isSmDropDownOpen && 'hidden')}
    >
      <div className="flex flex-col">Жопа</div>
    </div>
  );
};
