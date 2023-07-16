import React from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from './Modal';
import { TextInput } from './Modal/TextInput';

interface CreateStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStateModalFormValues) => void;
}

export interface CreateStateModalFormValues {
  name: string;
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
    <Modal {...props} onRequestClose={onRequestClose} title="Create State" onSubmit={handleSubmit}>
      <TextInput
        label="Name:"
        placeholder="State"
        {...register('name', {
          required: 'This field is required',
          minLength: { value: 4, message: 'Minimum 4 characters' },
        })}
        error={!!errors.name}
        errorMessage={errors.name?.message ?? ''}
      />
    </Modal>
  );
};
