import { useLayoutEffect, useRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
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
  onDelete: (index: number) => void;
}
export const StateMachinesStack: React.FC<StateMachinesStackProps> = ({
  selectedStateMachines,
  onDragStart,
  onDragEnd,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [selectedStateMachines]);

  const handleOnDelte = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, index: number) => {
    e.stopPropagation();
    onDelete(index);
  };

  return (
    <div
      className="h-[30vh] w-full overflow-y-auto scroll-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
      ref={containerRef}
    >
      {selectedStateMachines.map((sm, index) => {
        return (
          <div key={sm.id} className={twMerge(isSelected(index) && 'bg-bg-active')}>
            <div
              className="ml-6 mr-6 flex cursor-pointer select-none items-center p-2 transition-colors duration-75"
              draggable
              onDragStart={() => onDragStart(index)}
              onDragEnd={() => onDragEnd()}
              onClick={() => onSelect(index)}
            >
              <div className="flex-col">
                <div className="text-base">{sm.id}</div>
                <div className="text-sm">
                  <i>{sm.platform.name}</i>
                </div>
              </div>
              <button
                type="button"
                className="ml-auto rounded p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
                onClick={(e) => handleOnDelte(e, index)}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
            <hr className="ml-6 mr-6 h-[1px] w-auto border-bg-hover opacity-70" />
          </div>
        );
      })}
    </div>
  );
};
