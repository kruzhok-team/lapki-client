import { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Modal } from '@renderer/components/UI';
import { AddressData } from '@renderer/types/FlasherTypes';

import { AddressBookRow } from './AddressBookRow';

interface AddressBookModalProps {
  addressBookSetting: AddressData[] | null;
  setAddressBookSetting: (value: AddressData[]) => Promise<unknown>;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
  addressEnrtyEdit: (data: AddressData) => void;
  addressEntryAdd: () => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  addressBookSetting,
  setAddressBookSetting,
  onClose,
  onSelect,
  addressEnrtyEdit,
  addressEntryAdd,
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
  // выбранная запись с адресом, undefined означает, что ни одна запись не выбрана
  const [selectedEntry, setSelectedEntry] = useState<number | undefined>(undefined);
  const onRemove = () => {
    if (!addressBookSetting || !selectedEntry) return;
    setIdStorage(idStorage.toSpliced(selectedEntry, 1));
    setAddressBookSetting(addressBookSetting.toSpliced(selectedEntry, 1));
    setSelectedEntry(undefined);
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
      <div className="flex gap-2 pl-4">
        <div className="flex h-60 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {addressBookSetting?.length === 0 && (
            <p className="mx-2 my-2 flex text-text-inactive">Нет записей в книге</p>
          )}
          {addressBookSetting?.map((field, index) => (
            <div key={getID(index)}>
              <AddressBookRow
                isSelected={index == selectedEntry}
                data={field}
                onSelect={() => {
                  if (index != selectedEntry) {
                    setSelectedEntry(index);
                  } else {
                    setSelectedEntry(undefined);
                  }
                }}
                onEdit={() => addressEnrtyEdit(field)}
              ></AddressBookRow>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-secondary p-1"
            onClick={addressEntryAdd}
            disabled={!addressBookSetting}
          >
            <AddIcon />
          </button>
          <button type="button" className="btn-secondary p-1" onClick={onRemove}>
            <SubtractIcon />
          </button>
        </div>
      </div>
    </Modal>
  );
};
