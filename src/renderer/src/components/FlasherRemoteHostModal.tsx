import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

import { TextInput } from './Modal/TextInput';

interface FlasherRemoteHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (host: string, port: number) => void;
}

export interface FlasherRemoteHostFormValues {
  idx: string;
  host: string;
  port: number;
}

export const FlasherRemoteHostModal: React.FC<FlasherRemoteHostModalProps> = ({
  onClose,
  onSubmit,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
  } = useForm<FlasherRemoteHostFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    onRequestClose();
    onSubmit(data.host, data.port);
  });

  const onRequestClose = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Подключение к удалённому загрузчику'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Хост:"
        {...register('host', {
          required: 'Это поле обязательно к заполнению!',
        })}
        placeholder="Напишите адрес хоста"
        isElse={false}
        error={false}
        errorMessage={''}
      />
      <TextInput
        label="Порт:"
        {...register('port', {
          required: 'Это поле обязательно к заполнению!',
        })}
        placeholder="Напишите порт"
        isElse={false}
        error={false}
        errorMessage={''}
      />
    </Modal>
  );
};
