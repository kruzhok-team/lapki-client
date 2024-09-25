import React from 'react';

import { useFieldArray, useForm } from 'react-hook-form';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { Modal, TextInput } from '@renderer/components/UI';

export interface AddressBookFormValues {
  desc: { name: string; address: string }[];
}

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({ onClose, ...props }) => {
  const {
    control,
    register,
    formState: { errors },
  } = useForm<AddressBookFormValues>();

  const { fields, append, remove } = useFieldArray({
    name: 'desc',
    control,
  });

  return (
    <Modal {...props} onRequestClose={onClose} title="Адресная книга">
      <div>
        <div className="mb-2 flex flex-col gap-1">
          {fields.length === 0 && <p className="text-text-inactive">Нет записей в книге</p>}
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-1">
              <label className="flex flex-col">
                <TextInput
                  {...register(`desc.${index}.name` as const, { required: 'Обязательное поле' })}
                  error={!!errors?.desc?.[index]?.name}
                  placeholder="Название"
                />
                <p className="text-sm text-error">{errors?.desc?.[index]?.name?.message}</p>
              </label>

              <label className="flex w-full flex-col">
                <TextInput
                  {...register(`desc.${index}.address` as const, { required: 'Обязательное поле' })}
                  error={!!errors?.desc?.[index]?.address}
                  maxLength={16}
                  placeholder="Адрес"
                  className="w-full max-w-full"
                />
                <p className="text-sm text-error">{errors?.desc?.[index]?.address?.message}</p>
              </label>
              <button
                type="button"
                className="rounded p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
                onClick={() => remove(index)}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary flex items-center gap-3 pl-5"
          onClick={() => append({ name: '', address: '' })}
        >
          <AddIcon className="size-6" />
          Добавить
        </button>
      </div>
    </Modal>
  );
};
