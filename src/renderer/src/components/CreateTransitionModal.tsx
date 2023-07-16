import React from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from './Modal';
import { TextInput } from './Modal/TextInput';
import { ColorInput } from './ColorInput';

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
      title="Create Transition"
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Component:"
        placeholder="Component"
        {...register('component', {
          required: 'This field is required',
          minLength: { value: 4, message: 'Minimum 4 characters' },
        })}
        error={!!errors.component}
        errorMessage={errors.component?.message ?? ''}
      />

      <TextInput
        label="Method:"
        placeholder="Method"
        {...register('method', {
          required: 'This field is required',
          minLength: { value: 4, message: 'Minimum 4 characters' },
        })}
        error={!!errors.method}
        errorMessage={errors.method?.message ?? ''}
      />

      <ColorInput
        label="Color:"
        {...register('color', { required: 'This field is required' })}
        error={!!errors.color}
        errorMessage={errors.color?.message ?? ''}
      />
    </Modal>
  );
};
