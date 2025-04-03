import React, { useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { getAvailablePlatforms, getPlatform } from '@renderer/lib/data/PlatformLoader';
import { Platform } from '@renderer/types/platform';

import { StateMachinesStack, StateMachinesStackItem } from './StateMachinesStack';

interface PlatformSelectionProps {
  selectedPlatformIdx: string | null;
  setSelectedPlatformIdx: (value: string | null) => void;
  selectedStateMachineIndex: number | null;
  setSelectedStateMachineIndex: (value: number | null) => void;
  selectedStateMachines: StateMachinesStackItem[];
  onAddPlatform: (platform: Platform) => void;
  onDeletePlatform: (index: number) => void;
}

export const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  selectedStateMachines,
  selectedPlatformIdx,
  setSelectedPlatformIdx,
  selectedStateMachineIndex,
  setSelectedStateMachineIndex,
  onAddPlatform,
  onDeletePlatform,
}) => {
  const handleClickPlatform = (idx: string) => {
    setSelectedPlatformIdx(idx);
    setSelectedStateMachineIndex(null);
  };
  const handleClickStateMachine = (index: number) => {
    setSelectedPlatformIdx(null);
    setSelectedStateMachineIndex(index);
  };

  const isPlatformSelected = (idx: string) => selectedPlatformIdx === idx;

  const isStateMachineSelected = (index: number) => selectedStateMachineIndex === index;

  const [draggedPlatformIdx, setDraggedPlatformIdx] = useState<string | null>(null);

  const [draggedStateMachineIndex, setDraggedStateMachineIndex] = useState<number | null>(null);

  const platforms = getAvailablePlatforms();
  const selectedPlatform = useMemo(() => {
    if (selectedPlatformIdx !== null) {
      return getPlatform(selectedPlatformIdx);
    }
    if (selectedStateMachineIndex !== null) {
      return selectedStateMachines[selectedStateMachineIndex].platform;
    }
    return null;
  }, [selectedPlatformIdx, selectedStateMachineIndex]);

  const handleAddPlatform = (platformIdx: string) => {
    const platform = getPlatform(platformIdx);
    if (platform === undefined) return;
    onAddPlatform(platform);
  };

  const handleDropPlatformOnStateMachines = () => {
    if (draggedPlatformIdx === null) return;
    handleAddPlatform(draggedPlatformIdx);
  };

  const handleDropStateMachineOnPlatforms = () => {
    if (draggedStateMachineIndex === null) return;
    if (selectedStateMachineIndex === draggedStateMachineIndex) {
      setSelectedStateMachineIndex(null);
    }
    onDeletePlatform(draggedStateMachineIndex);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div onDrop={() => handleDropPlatformOnStateMachines()}>
        <h2>
          <b>Выбрано</b>
        </h2>
        <div className="h-[30vh] bg-bg-secondary">
          {selectedStateMachines.length > 0 ? (
            <StateMachinesStack
              selectedStateMachines={selectedStateMachines}
              onDragStart={(index) => setDraggedStateMachineIndex(index)}
              onDragEnd={() => setDraggedStateMachineIndex(null)}
              isSelected={isStateMachineSelected}
              onSelect={handleClickStateMachine}
            />
          ) : (
            <label className="opacity-70">
              Добавьте платформы сюда двойным кликом левой кнопкой мыши, либо перетащив их сюда
            </label>
          )}
        </div>
      </div>
      <div>
        <h2>
          <b>Платформы</b>
        </h2>
        <div
          className="max-h-[30vh] w-full overflow-y-auto bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
          onDrop={() => handleDropStateMachineOnPlatforms()}
        >
          {platforms.map(({ idx, name }) => (
            <div>
              <div
                key={idx}
                className={twMerge(
                  'flex cursor-pointer select-none items-center gap-2 p-2 transition-colors duration-75',
                  isPlatformSelected(idx) && 'bg-bg-active'
                )}
                onDoubleClick={() => handleAddPlatform(idx)}
                onClick={() => handleClickPlatform(idx)}
                draggable
                onDragStart={() => setDraggedPlatformIdx(idx)}
                onDragEnd={() => setDraggedPlatformIdx(null)}
              >
                {name}
              </div>
              <hr className="h-[1px] w-auto border-bg-hover opacity-70" />
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-2">
        <h2>
          <b>{selectedPlatform?.name ?? 'Подсказка'}</b>
        </h2>
        <div
          className={twMerge(
            'h-[10vh] w-full overflow-y-auto leading-tight scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb',
            selectedPlatform?.description ?? 'opacity-70'
          )}
        >
          {selectedPlatform?.description ||
            'Выберите платформу из одного из списков сверху, чтобы посмотреть описание платформы.'}
        </div>
      </div>
    </div>
  );
};
