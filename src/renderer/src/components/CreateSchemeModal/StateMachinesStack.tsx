import { useLayoutEffect, useRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { Platform } from '@renderer/types/platform';

export type StateMachinesStackItem = {
  id: string;
  platform: Platform;
};
interface StateMachinesStackProps {
  selectedStateMachines: StateMachinesStackItem[];
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  isSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
}
export const StateMachinesStack: React.FC<StateMachinesStackProps> = ({
  selectedStateMachines,
  onDragStart,
  onDragEnd,
  isSelected,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [selectedStateMachines]);
  return (
    <div
      className="h-[30vh] w-full overflow-y-auto scroll-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
      ref={containerRef}
    >
      {selectedStateMachines.map((sm, index) => {
        return (
          <div key={sm.id}>
            <div
              className={twMerge(
                'cursor-pointer  select-none flex-col items-center gap-2 p-2 transition-colors duration-75',
                isSelected(index) && 'bg-bg-active'
              )}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragEnd={() => onDragEnd()}
              onClick={() => onSelect(index)}
            >
              <div className="text-base">{sm.id}</div>
              <div className="text-sm">
                <i>{sm.platform.name}</i>
              </div>
            </div>
            <hr className="h-[1px] w-auto border-bg-hover opacity-70" />
          </div>
        );
      })}
    </div>
  );
};
