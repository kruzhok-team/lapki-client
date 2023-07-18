import React from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';
import { TextInput } from './Modal/TextInput';
import { ColorInput } from './Modal/ColorInput';

interface CreateStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStateModalFormValues) => void;
}

export interface CreateStateModalFormValues {
  name: string;
  events: string;
  component: string;
  method: string;
  color: string;
}

export const CreateStateModal: React.FC<CreateStateModalProps> = ({
  onSubmit,
  onClose,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<CreateStateModalFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
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
      title="Изменить состояние"
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Имя состояния:"
        placeholder="Состояние"
        {...register('name', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.name}
        errorMessage={errors.name?.message ?? ''}
      />

      <TextInput
        label="Событие:"
        placeholder="Событие"
        {...register('events', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.events}
        errorMessage={errors.events?.message ?? ''}
      />

      <TextInput
        label="Компонент:"
        placeholder="Компонент"
        {...register('component', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.component}
        errorMessage={errors.component?.message ?? ''}
      />

      <TextInput
        label="Метод:"
        placeholder="Метод"
        {...register('method', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа!' },
        })}
        error={!!errors.method}
        errorMessage={errors.method?.message ?? ''}
      />

      <ColorInput
        label="Цвет связи:"
        {...register('color', { required: 'Это поле обязательно к заполнению!' })}
        error={!!errors.color}
        errorMessage={errors.color?.message ?? ''}
      />
    </Modal>
  );
};
