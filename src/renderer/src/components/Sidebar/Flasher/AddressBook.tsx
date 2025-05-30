import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as LensIcon } from '@renderer/assets/icons/metadata.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Modal } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks';
import { AddressData } from '@renderer/types/FlasherTypes';

import { AddressBookRow } from './AddressBookRow';
import { MetaDataModal } from './MetaData';

interface AddressBookModalProps {
  addressBookSetting: AddressData[] | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entryId: number) => void;
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

  const [isMetaDataOpen, openMetaData, closeMetaData] = useModal(false);

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
    setSelectedEntry(undefined);
    onRemove(selectedEntry);
  };

  const { handleSubmit: hookHandleSubmit } = useForm();

  const handleSubmit = hookHandleSubmit(() => {
    if (selectedEntry === undefined || addressBookSetting === null) return;
    const ID = getID(selectedEntry);
    if (ID !== null) {
      onSubmit(ID);
    }
  });

  const metaDataModal = () => {
    if (addressBookSetting !== null && selectedEntry !== undefined) {
      return (
        <MetaDataModal
          addressData={addressBookSetting[selectedEntry]}
          isOpen={isMetaDataOpen}
          onClose={closeMetaData}
        />
      );
    }
    return null;
  };

  return (
    <div>
      <Modal
        {...props}
        onRequestClose={onClose}
        title="Адресная книга"
        onSubmit={handleSubmit}
        submitDisabled={selectedEntry === undefined}
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
                onSelect={() => undefined}
                onEdit={() => undefined}
                onDragStart={() => undefined}
                onDrop={() => undefined}
              />
            )}
            {addressBookSetting?.map((field, index) => {
              const ID = getID(index);
              if (ID === null) return;
              return (
                <div key={getID(index)}>
                  <AddressBookRow
                    isSelected={index === selectedEntry}
                    data={field}
                    onSelect={() => setSelectedEntry(index)}
                    onEdit={() => handleEdit(field, index)}
                    onDragStart={() => setDragIndex(index)}
                    onDrop={() => handleSwapEntries(index)}
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
            <button
              type="button"
              className="btn-secondary p-1"
              // (Roundabout1) Если значение selectedEntry не определено, то кнопка будет заблокирована,
              // также кнопка не будет отрисована пока не загрузится адресная книга, поэтому доп. проверка не нужна здесь
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              onClick={() => addressEnrtyEdit(addressBookSetting![selectedEntry!])}
              disabled={selectedEntry === undefined}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="btn-secondary p-1"
              onClick={() => openMetaData()}
              disabled={selectedEntry === undefined}
            >
              <LensIcon />
            </button>
          </div>
        </div>
      </Modal>
      {metaDataModal()}
    </div>
  );
};
