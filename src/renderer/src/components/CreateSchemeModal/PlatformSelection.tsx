import React, { useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { getAvailablePlatforms, getPlatform } from '@renderer/lib/data/PlatformLoader';

import { StateMachinesStack, StateMachinesStackItem } from './StateMachinesStack';

interface PlatformSelectionProps {
  selectedPlatformIdx: string | null;
  setSelectedPlatformIdx: (value: string) => void;
  onDoubleClick?: () => void;
  selectedStateMachines: StateMachinesStackItem[];
  onAddPlatform: (stateMachine: StateMachinesStackItem) => void;
  onDeletePlatform: (index: number) => void;
}

export const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  selectedStateMachines,
  selectedPlatformIdx,
  setSelectedPlatformIdx,
  onDoubleClick,
  onAddPlatform,
  onDeletePlatform,
}) => {
  const handleClick = (idx: string) => () => setSelectedPlatformIdx(idx);

  const isSelected = (idx: string) => selectedPlatformIdx === idx;

  const [draggedPlatformIdx, setDraggedPlatformIdx] = useState<string | null>(null);

  const [draggedStateMachineIndex, setDraggedStateMachineIndex] = useState<number | null>(null);

  const platforms = getAvailablePlatforms();
  const selectedPlatform = useMemo(
    () => platforms.find(({ idx }) => selectedPlatformIdx === idx),
    [platforms, selectedPlatformIdx]
  );

  const handleDropPlatformOnStateMachines = () => {
    if (draggedPlatformIdx === null) return;
    const platform = getPlatform(draggedPlatformIdx);
    if (platform === undefined) return;
    onAddPlatform({ platform: platform });
  };

  const handleDropStateMachineOnPlatforms = () => {
    if (draggedStateMachineIndex === null) return;
    onDeletePlatform(draggedStateMachineIndex);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div onDrop={() => handleDropPlatformOnStateMachines()}>
        <h2>Выбранные платформы</h2>
        {selectedStateMachines.length > 0 ? (
          <StateMachinesStack
            selectedStateMachines={selectedStateMachines}
            onDragStart={(index) => setDraggedStateMachineIndex(index)}
            onDragEnd={() => setDraggedStateMachineIndex(null)}
          />
        ) : (
          <label className="opacity-70">Перетащите платформы сюда</label>
        )}
      </div>
      <div>
        Список платформ
        <div
          className="max-h-[40vh] w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
          onDrop={() => handleDropStateMachineOnPlatforms()}
        >
          {platforms.map(({ idx, name }) => (
            <div
              key={idx}
              className={twMerge(
                'flex cursor-pointer select-none items-center gap-2 p-2 transition-colors duration-75',
                isSelected(idx) && 'bg-bg-active'
              )}
              onDoubleClick={onDoubleClick}
              onClick={handleClick(idx)}
              draggable
              onDragStart={() => setDraggedPlatformIdx(idx)}
              onDragEnd={() => setDraggedPlatformIdx(null)}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2>Описание</h2>
        <div className={twMerge(selectedPlatform?.description ?? 'opacity-70')}>
          {selectedPlatform?.description ||
            'Для начала работы выберите платформу из списка слева. Платформа определяет, для чего создаётся схема и с помощью каких элементов.'}
        </div>
      </div>
    </div>
  );
};
