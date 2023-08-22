import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

interface FlasherSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleLocal: () => void;
  handleRemote: () => void;
}

export interface FlasherSelectModalFormValues {
  idx: string;
}

export const FlasherSelectModal: React.FC<FlasherSelectModalProps> = ({
  onClose,
  handleLocal,
  handleRemote,
  ...props
}) => {
  const { reset } = useForm<FlasherSelectModalFormValues>();

  const justSubmit = (isLocal: boolean) => {
    if (isLocal) {
      handleLocal();
    } else {
      handleRemote();
    }
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
      title={'Выберите загрузчик'}
      submitLabel="Подключиться"
    >
      <button
        type="button"
        className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => justSubmit(true)}
      >
        Локальный
      </button>
      <br /> <br />
      <button
        type="button"
        className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
        onClick={() => justSubmit(false)}
      >
        Удалённый
      </button>
    </Modal>
  );
};
