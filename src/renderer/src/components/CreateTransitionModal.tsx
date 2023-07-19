import React from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';
import { TextInput } from './Modal/TextInput';
import { ColorInput } from './Modal/ColorInput';

interface CreateTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransitionModalFormValues) => void;
}

export interface CreateTransitionModalFormValues {
  color: string;
  component: string;
  method: string;
}

export const CreateTransitionModal: React.FC<CreateTransitionModalProps> = ({
  onSubmit,
  onClose,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<CreateTransitionModalFormValues>();

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
      title="Редактор соединения"
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Компонент:"
        placeholder="Компонент"
        {...register('component', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа' },
        })}
        error={!!errors.component}
        errorMessage={errors.component?.message ?? ''}
      />

      <TextInput
        label="Метод:"
        placeholder="Метод"
        {...register('method', {
          required: 'Это поле обязательно к заполнению!',
          minLength: { value: 4, message: 'Минимум 4 символа' },
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
