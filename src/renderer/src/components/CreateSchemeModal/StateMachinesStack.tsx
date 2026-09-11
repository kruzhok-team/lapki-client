import { twMerge } from 'tailwind-merge';

import { Platform } from '@renderer/types/platform';

import { DeleteButton } from '../UI/DeleteButton';
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
  const handleOnDelte = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, index: number) => {
    e.stopPropagation();
    onDelete(index);
  };

  return (
    <>
      {selectedStateMachines.map((sm, index) => {
        return (
          <div
            key={sm.id}
            className={twMerge(
              'group flex cursor-pointer select-none items-center rounded-lg px-3 py-1.5 transition-colors hover:bg-bg-hover',
              isSelected(index) && 'bg-bg-active'
            )}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnd={() => onDragEnd()}
            onClick={() => onSelect(index)}
          >
            <div className="min-w-0 leading-4">
              <div className="truncate">{sm.platform.name}</div>
            </div>
            <DeleteButton onClick={(e) => handleOnDelte(e, index)} />
          </div>
        );
      })}
    </>
  );
};
