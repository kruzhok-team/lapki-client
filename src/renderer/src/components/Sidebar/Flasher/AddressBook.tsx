import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Modal } from '@renderer/components/UI';
import { AddressData } from '@renderer/types/FlasherTypes';

import { AddressBookRow } from './AddressBookRow';

interface AddressBookModalProps {
  addressBookSetting: AddressData[] | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entryIds: (string | number)[]) => void;
  onRemove: (index: number) => void;
  onSwapEntries: (index1: number, index2: number) => void;
  getID: (index: number) => number | null;
  addressEnrtyEdit: (data: AddressData) => void;
  openAddressEnrtyAdd: () => void;
}

/**
 * Модальное окно с адресной книгой МС-ТЮК.
 */
export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  addressBookSetting,
  onRemove,
  onSwapEntries,
  getID,
  onClose,
  onSubmit,
  addressEnrtyEdit,
  openAddressEnrtyAdd,
  ...props
}) => {
  // выбранная запись с адресом, undefined означает, что ни одна запись не выбрана;
  const [selectedEntry, setSelectedEntry] = useState<number | undefined>(undefined);
  // индекс записи для переноса при начале drag
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);

  // выбрано всё
  const [checkedAll, setCheckedAll] = useState<boolean>(false);
  // не отмеченные адреса
  // TODO: переделать тип ключа на string после мёржа PR
  const [checked, setChecked] = useState<Set<number | string>>(new Set());

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
    if (addressBookSetting === null) return;
    // const entryIds = checked.keys().toArray();
    // console.log(entryIds);
    onSubmit(Array.from(checked));
    onClose();
  });

  const handleChangeCheckedAll = () => {
    if (addressBookSetting === null) return;
    setCheckedAll(!checkedAll);
    if (checkedAll) {
      setChecked(new Set());
      return;
    }
    const newChecked: Set<number | string> = new Set();
    for (let i = 0; i < addressBookSetting.length; i++) {
      const ID = getID(i);
      if (ID === null) continue;
      newChecked.add(ID);
    }
    setChecked(newChecked);
  };

  const handleChangeChecked = (ID: number | string, isChecked: boolean) => {
    setChecked((oldValue) => {
      const newValue = new Set(oldValue);
      if (isChecked) {
        newValue.delete(ID);
      } else {
        newValue.add(ID);
      }
      return newValue;
    });
    if (checkedAll) {
      setCheckedAll(!checkedAll);
    }
  };

  return (
    <div>
      <Modal
        {...props}
        onRequestClose={onClose}
        title="Адресная книга"
        onSubmit={handleSubmit}
        submitDisabled={checked.size === 0}
        submitLabel="Добавить в таблицу прошивок"
      >
        <div className="flex gap-2 pl-4">
          <div className="flex h-60 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {addressBookSetting === null ? (
              <p className="mx-2 my-2 flex text-text-inactive">Адресная книга не загрузилась</p>
            ) : addressBookSetting.length === 0 ? (
              <p className="mx-2 my-2 flex text-text-inactive">Нет записей в книге</p>
            ) : (
              <AddressBookRow
                // заголовок таблицы
                isSelected={false}
                data={{ name: 'Название', address: 'Адрес', type: 'Тип', meta: undefined }}
                isChecked={checkedAll}
                onSelect={() => undefined}
                onEdit={() => undefined}
                onDragStart={() => undefined}
                onDrop={() => undefined}
                onCheckChange={handleChangeCheckedAll}
              />
            )}
            {addressBookSetting?.map((field, index) => {
              const ID = getID(index);
              if (ID === null) return;
              const isChecked = checked.has(ID);
              return (
                <div key={ID}>
                  <AddressBookRow
                    isSelected={index === selectedEntry}
                    data={field}
                    isChecked={isChecked}
                    onSelect={() => setSelectedEntry(index)}
                    onEdit={() => handleEdit(field, index)}
                    onDragStart={() => setDragIndex(index)}
                    onDrop={() => handleSwapEntries(index)}
                    onCheckChange={() => handleChangeChecked(ID, isChecked)}
                  />
                </div>
              );
            })}
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
    </div>
  );
};
