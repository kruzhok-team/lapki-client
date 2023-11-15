import React, { useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';

import { Modal } from './Modal/Modal';

interface PlatformSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (idx: string) => void;
}

export const PlatformSelectModal: React.FC<PlatformSelectModalProps> = ({
  onClose,
  onCreate,
  ...props
}) => {
  const [selectedPlatformIdx, setSelectedPlatformIdx] = useState<string | null>(null);

  const handleClick = (idx: string) => () => setSelectedPlatformIdx(idx);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatformIdx) return;

    onCreate(selectedPlatformIdx);
    handleCLose();
  };

  const handleCLose = () => {
    onClose();
    setSelectedPlatformIdx(null);
  };

  const isSelected = (idx: string) => selectedPlatformIdx === idx;

  const platforms = getAvailablePlatforms();
  const selectedPlatform = useMemo(
    () => platforms.find(({ idx }) => selectedPlatformIdx === idx),
    [platforms, selectedPlatformIdx]
  );

  return (
    <Modal
      {...props}
      onRequestClose={handleCLose}
      onSubmit={handleSubmit}
      title="Выберите платформу"
    >
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

        <div>{selectedPlatform?.description || 'Пока что нет описания'}</div>
      </div>
    </Modal>
  );
};
