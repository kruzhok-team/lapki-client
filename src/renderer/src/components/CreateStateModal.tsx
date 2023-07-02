import React from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from './Modal';
import { twMerge } from 'tailwind-merge';

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
    <Modal {...props} onRequestClose={onRequestClose} title="Create State">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 text-base">
          <label className={twMerge('flex flex-col', errors.name?.message && 'text-red-500')}>
            Name:
            <input
              className={twMerge(
                'max-w-[250px] rounded border bg-transparent px-3 py-2 outline-none transition-colors placeholder:font-normal',
                errors.name?.message && 'border-red-500 placeholder:text-red-500',
                !errors.name?.message &&
                  'border-neutral-200 text-neutral-50 focus:border-neutral-50'
              )}
              placeholder="State"
              {...register('name', {
                required: 'This field is required',
                minLength: { value: 4, message: 'Minimum 4 characters' },
              })}
            />
            <p className="min-h-[24px] text-[14px] text-red-500">
              {errors.name && errors.name.message}
            </p>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-neutral-400 transition-colors hover:text-neutral-50"
            onClick={onRequestClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};
