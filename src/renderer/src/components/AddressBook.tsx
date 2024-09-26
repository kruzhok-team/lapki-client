import { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { Modal } from '@renderer/components/UI';
import { AddressData } from '@renderer/types/FlasherTypes';

import { AddressBookRow } from './AddressBookRow';

interface AddressBookModalProps {
  addressBookSetting: AddressData[] | null;
  setAddressBookSetting: (value: AddressData[]) => Promise<any>;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  addressBookSetting,
  setAddressBookSetting,
  onClose,
  onSelect,
  ...props
}) => {
  const [idStorage, setIdStorage] = useState<number[]>([]);
  const [idCounter, setIdCounter] = useState<number>(0);
  const getID = (index: number) => {
    if (index < idStorage.length) {
      return idStorage[index];
    }
    const id = idCounter;
    setIdStorage([...idStorage, id]);
    setIdCounter(id + 1);
    return id;
  };
  const handleOnSelect = (address: string | undefined) => {
    if (address != undefined) {
      onClose();
      onSelect(address);
    }
  };
  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Адресная книга"
      onAfterClose={() => {
        if (!addressBookSetting) return;
        setAddressBookSetting(addressBookSetting);
      }}
    >
      <div>
        <div className="mb-2 flex flex-col gap-1">
          {addressBookSetting?.length === 0 && (
            <p className="text-text-inactive">Нет записей в книге</p>
          )}
          {addressBookSetting?.map((field, index) => (
            <div key={getID(index)}>
              <AddressBookRow
                data={field}
                onSelect={handleOnSelect}
                onRemove={() => {
                  setIdStorage(idStorage.toSpliced(index, 1));
                  setAddressBookSetting(addressBookSetting.toSpliced(index, 1));
                }}
              ></AddressBookRow>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary flex items-center gap-3 pl-5"
          onClick={() => {
            const emptyRow: AddressData = { name: '', address: '', type: '' };
            if (addressBookSetting != null) {
              setAddressBookSetting([...addressBookSetting, emptyRow]);
            } else {
              setAddressBookSetting([emptyRow]);
            }
          }}
        >
          <AddIcon className="size-6" />
          Добавить
        </button>
      </div>
    </Modal>
  );
};
