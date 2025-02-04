import React from 'react';

import { twMerge } from 'tailwind-merge';

import { WithHint } from '@renderer/components/UI';
import { useSidebar } from '@renderer/store/useSidebar';

interface LabelsProps {
  items: Array<{ Icon: JSX.Element; bottom?: boolean; hint: string; action?: () => void }>;
}

export const Labels: React.FC<LabelsProps> = ({ items }) => {
  const [activeTab, changeTab] = useSidebar((state) => [state.activeTab, state.changeTab]);

  return (
    <div className="flex flex-col border-r border-border-primary bg-bg-primary">
      {items.map(({ Icon, bottom = false, hint, action }, i) => (
        <WithHint key={i} hint={hint} placement="right" offset={5} delay={100}>
          {(props) => (
            <button
              className={twMerge(
                'w-12 border-l-2 border-transparent p-2 text-text-inactive transition-colors hover:text-text-primary',
                activeTab === i && 'border-primary text-text-primary',
                bottom && 'mt-auto'
              )}
              onClick={action ?? (() => changeTab(i))}
              {...props}
            >
              {Icon}
            </button>
          )}
        </WithHint>
      ))}
    </div>
  );
};
