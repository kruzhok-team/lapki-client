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

/**
 * Модальное окно с адресной книгой МС-ТЮК.
 */
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
  // выбранная запись с адресом, undefined означает, что ни одна запись не выбрана;
  // не должно равняться нулю, так как нулевой элементо - это заголовок таблицы
  const [selectedEntry, setSelectedEntry] = useState<number | undefined>(undefined);
  const onRemove = () => {
    if (!addressBookSetting || selectedEntry == undefined) return;
    setIdStorage(idStorage.toSpliced(selectedEntry, 1));
    setAddressBookSetting(addressBookSetting.toSpliced(selectedEntry, 1));
    setSelectedEntry(undefined);
  };
  // индекс записи для переноса при начале drag
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);
  /**
   * замена двух записей при drag&drop
   * @param index - индекс второй записи, при drop, первая запись берётся из {@link dragIndex}
   */
  const onSwapEntries = (index: number) => {
    if (!addressBookSetting || dragIndex == undefined || dragIndex == 0 || index == 0) {
      setDragIndex(undefined);
      return;
    }
    const firstEntry = addressBookSetting[dragIndex];
    const secondEntry = addressBookSetting[index];
    const newBook = addressBookSetting.map((v, i) => {
      if (i === dragIndex) {
        return secondEntry;
      }
      if (i === index) {
        return firstEntry;
      }
      return v;
    });
    const newIdStorage = idStorage.map((v, i) => {
      if (i === dragIndex) {
        return idStorage[index];
      }
      if (i === index) {
        return idStorage[dragIndex];
      }
      return v;
    });
    setAddressBookSetting(newBook);
    setIdStorage(newIdStorage);
    setDragIndex(undefined);
  };
  const onDragStart = (index: number) => {
    if (index == 0) return;
    setDragIndex(index);
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
    if (index == 0) return;
    setSelectedEntry(index);
  };
  const onEdit = (data: AddressData, index: number) => {
    if (index == 0) return;
    onSelect(index);
    addressEnrtyEdit(data);
  };
  const { handleSubmit: hookHandleSubmit } = useForm();
  const handleSubmit = hookHandleSubmit(() => {
    if (selectedEntry == undefined || addressBookSetting == null) return;
    onSubmit(addressBookSetting[selectedEntry].address);
    onClose();
  });
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
        onSubmit={handleSubmit}
        submitDisabled={selectedEntry == undefined}
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
            {addressBookSetting?.map((field, index) => (
              <div key={getID(index)}>
                <AddressBookRow
                  isSelected={index === selectedEntry} // не должно равняться нулю, так как это индекс заголовка таблицы
                  data={field}
                  onSelect={() => onSelect(index)}
                  onEdit={() => onEdit(field, index)}
                  onDragStart={() => onDragStart(index)}
                  onDrop={() => onSwapEntries(index)}
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
              onClick={onRemove}
              disabled={selectedEntry == undefined}
            >
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
