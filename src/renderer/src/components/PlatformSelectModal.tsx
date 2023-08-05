import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

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
  const { reset, handleSubmit: hookHandleSubmit } = useForm<PlatformSelectModalFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    onCreate(data.idx);
    onRequestClose();
  });

  const justSubmit = (idx: string) => {
    onCreate(idx);
    onRequestClose();
  };

  const onRequestClose = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Выберите платформу'}
      submitLabel="Создать"
      onSubmit={undefined /* TODO: handleSubmit */}
    >
      <button
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
    </Modal>
  );
};
