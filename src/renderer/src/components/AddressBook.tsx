import React from 'react';

import { useFieldArray, useForm } from 'react-hook-form';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { Modal } from '@renderer/components/UI';
import { AddressData } from '@renderer/types/FlasherTypes';

import { AddressBookRow } from './AddressBookRow';

export interface AddressBookFormValues {
  desc: AddressData[];
}

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  onClose,
  onSelect,
  ...props
}) => {
  const { control } = useForm<AddressBookFormValues>();

  const { fields, append, remove } = useFieldArray({
    name: 'desc',
    control,
  });

  const handleOnSelect = (address: string | undefined) => {
    if (address != undefined) {
      onClose();
      onSelect(address);
    }
  };
  return (
    <Modal {...props} onRequestClose={onClose} title="Адресная книга">
      <div>
        <div className="mb-2 flex flex-col gap-1">
          {fields.length === 0 && <p className="text-text-inactive">Нет записей в книге</p>}
          {fields.map((field, index) => (
            <div key={field.id}>
              <AddressBookRow
                data={field}
                onSelect={handleOnSelect}
                onRemove={() => {
                  remove(index);
                }}
              ></AddressBookRow>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary flex items-center gap-3 pl-5"
          onClick={() => append({ name: '', address: '', type: '' })}
        >
          <AddIcon className="size-6" />
          Добавить
        </button>
      </div>
    </Modal>
  );
};
