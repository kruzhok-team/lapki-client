import React, { useMemo } from 'react';

import { twMerge } from 'tailwind-merge';

import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';

interface PlatformSelectionProps {
  selectedPlatformIdx: string | null;
  setSelectedPlatformIdx: (value: string) => void;
}

export const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  selectedPlatformIdx,
  setSelectedPlatformIdx,
}) => {
  const handleClick = (idx: string) => () => setSelectedPlatformIdx(idx);

  const isSelected = (idx: string) => selectedPlatformIdx === idx;

  const platforms = getAvailablePlatforms();
  const selectedPlatform = useMemo(
    () => platforms.find(({ idx }) => selectedPlatformIdx === idx),
    [platforms, selectedPlatformIdx]
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="max-h-[40vh] w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {platforms.map(({ idx, name }) => (
          <div
            key={idx}
            className={twMerge(
              'flex cursor-pointer select-none items-center gap-2 p-2 transition-colors duration-75',
              isSelected(idx) && 'bg-bg-active'
            )}
            onClick={handleClick(idx)}
          >
            {name}
          </div>
        ))}
      </div>

      <div className={twMerge(selectedPlatform?.description ?? 'opacity-70')}>
        {selectedPlatform?.description ||
          'Для начала работы выберите платформу из списка слева. Платформа определяет, для чего создаётся схема и с помощью каких элементов.'}
      </div>
    </div>
  );
};
