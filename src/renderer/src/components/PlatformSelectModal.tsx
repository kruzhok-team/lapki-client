import React from 'react';

import { Modal } from './Modal/Modal';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
interface PlatformSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (idx: string) => void;
}

export interface PlatformSelectModalFormValues {
  idx: string;
}

export const PlatformSelectModal: React.FC<PlatformSelectModalProps> = ({
  onClose,
  onCreate,
  ...props
}) => {
  /*
  const handleSubmit = hookHandleSubmit((data) => {
    onCreate(data.idx);
    onRequestClose();
  });
  */

  const justSubmit = (idx: string) => {
    onCreate(idx);
    onRequestClose();
  };

  const onRequestClose = () => {
    onClose();
  };
  
  const platforms = getAvailablePlatforms()

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Выберите платформу'}
      submitLabel="Создать"
      onSubmit={undefined /* TODO: handleSubmit */}
    >
    {platforms.map((platform) => (
      <span>
        <button
        type="button"
        className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => justSubmit(platform.idx)}
        >
          {platform.name}
        </button>
        <br /> <br />
      </span>
    ))}
      {/* <button
        type="button"
        className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => justSubmit('ArduinoUno')}
      >
        Arduino Uno
      </button>
      <br /> <br />
      <button
        type="button"
        className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => justSubmit('BearlogaDefend')}
      >
        Берлога/Защита пасеки
      </button>
      <br /> <br />
      <button
        type="button"
        className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => justSubmit('Bearloga-Autoborder')}
      >
        Bearloga-Autoborder
      </button> */}
    </Modal>
  );
};
