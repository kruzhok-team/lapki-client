import React from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';
import { TextInput } from './Modal/TextInput';

interface CreateStateModalProps {
  isOpen: boolean;
  isData: { state } | undefined;
  onClose: () => void;
  onSubmit: (data: CreateStateModalFormValues) => void;
}

export interface CreateStateModalFormValues {
  name: string;
  newName: string;
  events: string;
  component: string;
  method: string;
  color: string;
}

export const CreateStateModal: React.FC<CreateStateModalProps> = ({
  onSubmit,
  onClose,
  isData,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<CreateStateModalFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    data.name = isData?.state.target.data.name;
    onSubmit(data);
  });

  const onRequestClose = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Редактирование состояния: ' + JSON.stringify(isData?.state.target.data.name)}
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Имя состояния:"
        placeholder="Выберите состояние"
        {...register('newName', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.name}
        errorMessage={errors.name?.message ?? ''}
      />

      <TextInput
        label="Событие:"
        placeholder="Выберите событие"
        {...register('events', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.events}
        errorMessage={errors.events?.message ?? ''}
      />

      <TextInput
        label="Компонент:"
        placeholder="Выберите компонент"
        {...register('component', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.component}
        errorMessage={errors.component?.message ?? ''}
      />

      <TextInput
        label="Метод:"
        placeholder="Выберите метод"
        {...register('method', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.method}
        errorMessage={errors.method?.message ?? ''}
      />
    </Modal>
  );
};
