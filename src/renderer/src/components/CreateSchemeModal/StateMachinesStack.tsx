import { useLayoutEffect, useRef } from 'react';

import { Platform } from '@renderer/types/platform';

export type StateMachinesStackItem = {
  name?: string;
  platform: Platform;
};
interface StateMachinesStackProps {
  selectedStateMachines: StateMachinesStackItem[];
}
export const StateMachinesStack: React.FC<StateMachinesStackProps> = ({
  selectedStateMachines,
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
      {selectedStateMachines.map((sm) => {
        return (
          <div className="flex cursor-pointer items-center gap-2 p-2 transition-colors duration-75">{`${
            sm.name ?? sm.platform.nameTag ?? 'noname'
          } (${sm.platform.name})`}</div>
        );
      })}
    </div>
  );
};
