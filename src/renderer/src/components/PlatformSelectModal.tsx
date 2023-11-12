import React from 'react';

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
  const handleClick = (idx: string) => {
    onCreate(idx);
    onClose();
  };

  const platforms = getAvailablePlatforms();

  return (
    <Modal {...props} onRequestClose={onClose} title="Выберите платформу">
      <div className="flex flex-col items-start gap-2">
        {platforms.map((platform) => (
          <button
            key={platform.idx}
            type="button"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            onClick={() => handleClick(platform.idx)}
          >
            {platform.name}
          </button>
        ))}
      </div>
    </Modal>
  );
};
