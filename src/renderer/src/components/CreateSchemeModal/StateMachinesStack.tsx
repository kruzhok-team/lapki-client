import { useLayoutEffect, useRef } from 'react';

import { Platform } from '@renderer/types/platform';

export type StateMachinesStackItem = {
  id: string;
  platform: Platform;
};
interface StateMachinesStackProps {
  selectedStateMachines: StateMachinesStackItem[];
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
}
export const StateMachinesStack: React.FC<StateMachinesStackProps> = ({
  selectedStateMachines,
  onDragStart,
  onDragEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [selectedStateMachines]);
  return (
    <div
      className="max-h-[40vh] w-full overflow-y-auto scroll-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
      ref={containerRef}
    >
      {selectedStateMachines.map((sm, index) => {
        return (
          <div
            key={sm.id}
            className="flex cursor-pointer items-center gap-2 p-2 transition-colors duration-75"
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnd={() => onDragEnd()}
          >{`${sm.id} (${sm.platform.name})`}</div>
        );
      })}
    </div>
  );
};
