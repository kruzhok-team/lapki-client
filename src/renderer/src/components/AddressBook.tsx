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
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (address: string) => void;
  onRemove: (index: number) => void;
  onSwapEntries: (index1: number, index2: number) => void;
  onAdd: (data: AddressData) => void;
  onEdit: (data: AddressData, index: number) => void;
  getID: (index: number) => number | null;
}

/**
 * Модальное окно с адресной книгой МС-ТЮК.
 */
export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  addressBookSetting,
  onRemove,
  onSwapEntries,
  onAdd,
  onEdit,
  getID,
  onClose,
  onSubmit,
  ...props
}) => {
  const [isAddressEnrtyEditOpen, openAddressEnrtyEdit, closeAddressEnrtyEdit] = useModal(false); // для редактирования существующих записей в адресной книге
  const addressEntryEditForm = useForm<AddressData>();
  const [isAddressEnrtyAddOpen, openAddressEnrtyAdd, closeAddressEnrtyAdd] = useModal(false); // для добавления новых записей в адресную книгу
  const addressEntryAddForm = useForm<AddressData>();

  // выбранная запись с адресом, undefined означает, что ни одна запись не выбрана;
  const [selectedEntry, setSelectedEntry] = useState<number | undefined>(undefined);
  // индекс записи для переноса при начале drag
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);
  /**
   * замена двух записей при drag&drop
   * @param index - индекс второй записи, при drop, первая запись берётся из {@link dragIndex}
   */
  const handleSwapEntries = (index: number) => {
    if (addressBookSetting === null || dragIndex === undefined) {
      setDragIndex(undefined);
      return;
    }
    onSwapEntries(dragIndex, index);
    setDragIndex(undefined);
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
    if (selectedEntry === undefined) return;
    onEdit(data, selectedEntry);
  };
  const addressEntryAddSubmitHandle = (data: AddressData) => {
    addressEntryAddForm.reset();
    onAdd(data);
  };
  const handleEdit = (data: AddressData, index: number) => {
    setSelectedEntry(index);
    addressEnrtyEdit(data);
  };
  const handleRemove = () => {
    if (selectedEntry === undefined) return;
    onRemove(selectedEntry);
  };
  const { handleSubmit: hookHandleSubmit } = useForm();
  const handleSubmit = hookHandleSubmit(() => {
    if (selectedEntry === undefined || addressBookSetting === null) return;
    onSubmit(addressBookSetting[selectedEntry].address);
    onClose();
  });
  return (
    <div>
      <Modal
        {...props}
        onRequestClose={onClose}
        title="Адресная книга"
        onSubmit={handleSubmit}
        submitDisabled={selectedEntry === undefined}
        submitLabel="Выбрать"
      >
        <div className="flex gap-2 pl-4">
          <div className="flex h-60 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {addressBookSetting?.length === 0 && (
              // в адресной книге нулевым элементом является заголовком таблицы, он всегда должен присутствовать;
              // если массив пуст, то значит таблица ещё не загрузилась;
              // если таблица, не загрузилась, то скорее всего это произошло, потому что её нет в electron-settings,
              // перезапуск IDE может помочь в этом случае
              <p className="mx-2 my-2 flex text-text-inactive">Адресная книга не загрузилась</p>
            )}
            <AddressBookRow
              // заголовок таблицы
              isSelected={false}
              data={{ name: 'Название', address: 'Адрес', type: 'Тип', meta: undefined }}
              onSelect={() => undefined}
              onEdit={() => undefined}
              onDragStart={() => undefined}
              onDrop={() => undefined}
            ></AddressBookRow>
            {addressBookSetting?.map((field, index) => (
              <div key={getID(index)}>
                <AddressBookRow
                  isSelected={index === selectedEntry}
                  data={field}
                  onSelect={() => setSelectedEntry(index)}
                  onEdit={() => handleEdit(field, index)}
                  onDragStart={() => setDragIndex(index)}
                  onDrop={() => handleSwapEntries(index)}
                ></AddressBookRow>
              </div>
            ))}
            {addressBookSetting?.length === 1 && (
              <p className="mx-2 my-2 flex text-text-inactive">Нет записей в книге</p>
            )}
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
            <button
              type="button"
              className="btn-secondary p-1"
              onClick={handleRemove}
              disabled={selectedEntry === undefined}
            >
              <SubtractIcon />
            </button>
          </div>
        </div>
      </Modal>
      <AddressEntryEditModal
        addressBookSetting={addressBookSetting}
        form={addressEntryEditForm}
        isOpen={isAddressEnrtyEditOpen}
        onClose={closeAddressEnrtyEdit}
        onSubmit={addressEntryEditSubmitHandle}
        submitLabel="Сохранить"
      ></AddressEntryEditModal>
      <AddressEntryEditModal
        addressBookSetting={addressBookSetting}
        form={addressEntryAddForm}
        isOpen={isAddressEnrtyAddOpen}
        onClose={closeAddressEnrtyAdd}
        onSubmit={addressEntryAddSubmitHandle}
        submitLabel="Добавить"
      ></AddressEntryEditModal>
    </div>
  );
};
