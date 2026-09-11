import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { AddButton, Modal, ScrollArea, WithHint } from '@renderer/components/UI';
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
  getID: (index: number) => number | null;
  addressEnrtyEdit: (data: AddressData) => void;
  openAddressEnrtyAdd: () => void;
}

/** Модальное окно с адресной книгой МС-ТЮК. */
export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  addressBookSetting,
  isOpen,
  onRemove,
  getID,
  onClose,
  onSubmit,
  addressEnrtyEdit,
  openAddressEnrtyAdd,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<number>();
  const [metaDataEntry, setMetaDataEntry] = useState<AddressData>();
  const [isMetaDataOpen, openMetaData, closeMetaData] = useModal(false);
  const { handleSubmit: hookHandleSubmit } = useForm();

  const handleRemove = (index: number) => {
    onRemove(index);
    setSelectedEntry((currentSelection) => {
      if (currentSelection === undefined) return undefined;
      if (currentSelection === index) return undefined;
      return currentSelection > index ? currentSelection - 1 : currentSelection;
    });
  };

  const handleSubmit = hookHandleSubmit(() => {
    if (selectedEntry === undefined || addressBookSetting === null) return;
    const id = getID(selectedEntry);
    if (id !== null) onSubmit(id);
  });

  const handleClose = () => {
    setSelectedEntry(undefined);
    setMetaDataEntry(undefined);
    closeMetaData();
    onClose();
  };

  const handleMetaDataClose = () => {
    closeMetaData();
    setMetaDataEntry(undefined);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={handleClose}
        title="Адресная книга"
        onSubmit={handleSubmit}
        submitDisabled={selectedEntry === undefined}
        submitLabel="Добавить"
        hideCancelButton
      >
        <section className="flex h-full min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 justify-start">
            <WithHint hint="Добавить" placement="right">
              {(hintProps) => (
                <span {...hintProps}>
                  <AddButton
                    aria-label="Добавить запись"
                    onClick={openAddressEnrtyAdd}
                    disabled={!addressBookSetting}
                  />
                </span>
              )}
            </WithHint>
          </div>

          <ScrollArea className="min-h-0 flex-1 py-0" viewportClassName="mr-[6px]" role="listbox">
            {addressBookSetting === null ? (
              <p className="px-3 py-2 text-text-inactive">Адресная книга не загрузилась</p>
            ) : addressBookSetting.length === 0 ? (
              <p className="px-3 py-2 text-text-inactive">Нет записей в книге</p>
            ) : (
              <table className="w-full table-fixed border-separate border-spacing-0">
                <colgroup>
                  <col />
                  <col className="w-40" />
                  <col />
                  <col className="w-[78px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 font-medium">
                  <tr>
                    <td className="min-h-9 rounded-tl-[6px] border-b border-l border-r border-t border-border-primary bg-bg-primary px-[9px] py-[6px] text-center text-text-primary">
                      Название
                    </td>
                    <td className="min-h-9 border-b border-r border-t border-border-primary bg-bg-primary px-[9px] py-[6px] text-center text-text-primary">
                      Адрес
                    </td>
                    <td className="min-h-9 rounded-tr-[6px] border-b border-r border-t border-border-primary bg-bg-primary px-[9px] py-[6px] text-center text-text-primary">
                      Тип
                    </td>
                    <td aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {addressBookSetting.map((field, index) => {
                    const id = getID(index);
                    if (id === null) return null;
                    return (
                      <AddressBookRow
                        key={id}
                        isLast={index === addressBookSetting.length - 1}
                        isSelected={index === selectedEntry}
                        data={field}
                        onSelect={() => setSelectedEntry(index)}
                        onEdit={() => addressEnrtyEdit(field)}
                        onMetaData={() => {
                          setMetaDataEntry(field);
                          openMetaData();
                        }}
                        onRemove={() => handleRemove(index)}
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </ScrollArea>
        </section>
      </Modal>

      {metaDataEntry && (
        <MetaDataModal
          addressData={metaDataEntry}
          isOpen={isMetaDataOpen}
          onClose={handleMetaDataClose}
        />
      )}
    </>
  );
};
