import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { AddressData } from '@renderer/types/FlasherTypes';

import { AddressBookRow } from './AddressBookRow';
import { AddressEntryEditModal } from './AddressEntryModal';

interface AddressBookModalProps {
  addressBookSetting: AddressData[] | null;
  setAddressBookSetting: (value: AddressData[]) => Promise<unknown>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (address: string) => void;
  isDuplicate: (address: string) => boolean | undefined;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  addressBookSetting,
  setAddressBookSetting,
  onClose,
  onSubmit,
  isDuplicate,
  ...props
}) => {
  const [isAddressEnrtyEditOpen, openAddressEnrtyEdit, closeAddressEnrtyEdit] = useModal(false); // для редактирования существующих записей в адресной книге
  const addressEntryEditForm = useForm<AddressData>();
  const [isAddressEnrtyAddOpen, openAddressEnrtyAdd, closeAddressEnrtyAdd] = useModal(false); // для добавления новых записей в адресную книгу
  const addressEntryAddForm = useForm<AddressData>();

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
  /**
   * Открытие модального окна для редактирования существующей записи в адресной книге
   * @param data данные, которые нужно отредактированть
   */
  const addressEnrtyEdit = (data: AddressData) => {
    addressEntryEditForm.reset(data);
    openAddressEnrtyEdit();
  };
  /**
   * Обновление адресной книги после редактирования
   */
  const addressEntryEditSubmitHandle = (data: AddressData) => {
    if (!addressBookSetting || selectedEntry == undefined) return;
    const newBook = addressBookSetting.map((v, i) => {
      if (i === selectedEntry) {
        return data;
      } else {
        return v;
      }
    });
    console.log(newBook);
    setAddressBookSetting(newBook);
  };
  /**
   * Добавление новой записи в адресную книгу
   * @param data запись, которую следует добавить
   */
  const addressEntryAddSubmitHandle = (data: AddressData) => {
    if (!addressBookSetting) return;
    setAddressBookSetting([...addressBookSetting, data]);
    addressEntryAddForm.reset();
  };
  const onSelect = (index: number) => {
    setSelectedEntry(index);
  };
  const onEdit = (data: AddressData, index: number) => {
    onSelect(index);
    addressEnrtyEdit(data);
  };
  return (
    <div>
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
                  isSelected={index === selectedEntry}
                  data={field}
                  onSelect={() => onSelect(index)}
                  onEdit={() => onEdit(field, index)}
                ></AddressBookRow>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-secondary p-1"
              onClick={openAddressEnrtyAdd}
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
      <AddressEntryEditModal
        form={addressEntryEditForm}
        isOpen={isAddressEnrtyEditOpen}
        onClose={closeAddressEnrtyEdit}
        isDuplicate={isDuplicate}
        onSubmit={addressEntryEditSubmitHandle}
        submitLabel="Сохранить"
      ></AddressEntryEditModal>
      <AddressEntryEditModal
        form={addressEntryAddForm}
        isOpen={isAddressEnrtyAddOpen}
        onClose={closeAddressEnrtyAdd}
        isDuplicate={isDuplicate}
        onSubmit={addressEntryAddSubmitHandle}
        submitLabel="Добавить"
      ></AddressEntryEditModal>
    </div>
  );
};
