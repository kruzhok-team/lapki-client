import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LabelsProps {
  items: Array<{ Icon: JSX.Element; bottom?: boolean }>;
  activeTabIndex: number;
  onChange: (index: number) => void;
}

export const Labels: React.FC<LabelsProps> = ({ items, activeTabIndex, onChange }) => {
  return (
    <div className="flex flex-col border-r border-border-primary bg-bg-primary">
      {items.map(({ Icon, bottom = false }, i) => (
        <button
          key={i}
          className={twMerge(
            'w-12 border-l-2 border-transparent p-2 text-text-inactive transition-colors hover:text-text-primary',
            activeTabIndex === i && 'border-primary text-text-primary',
            bottom && 'mt-auto'
          )}
          onClick={() => onChange(i)}
        >
          {Icon}
        </button>
      ))}
    </div>
  );
};
