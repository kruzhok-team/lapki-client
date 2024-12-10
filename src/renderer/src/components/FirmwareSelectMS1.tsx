import { Component, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Checkbox, Modal, SelectOption, TextInput } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';
import { AddressData } from '@renderer/types/FlasherTypes';

interface FlashSelectMS1Props {
  addressBookSetting: AddressData[] | null;
  stateMachineAddresses: Map<string, number>;
  assignStateMachineToAddress: (smId: string, idx: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (address: string) => void;
}

export const FlashSelect: React.FC<FlashSelectMS1Props> = ({
  addressBookSetting,
  stateMachineAddresses,
  assignStateMachineToAddress,
  onClose,
  onSubmit,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm();
  const modelController = useModelContext();
  const stateMachinesId = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };
  const [isChecked, setIsChecked] = useState<Map<string, boolean>>(new Map());
  // индекс записи для переноса при начале drag
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);
  const onRemoveFile = () => {
    // TODO
  };
  const onAddFile = () => {
    // TODO
  };
  /**
   * замена двух записей при drag&drop
   * @param index - индекс второй записи, при drop, первая запись берётся из {@link dragIndex}
   */
  const onSwapEntries = (index: number) => {
    // TODO
  };
  const onDragStart = (index: number) => {
    // TODO
  };
  const handleSubmit = hookHandleSubmit(() => {
    // TODO
    onClose();
  });
  const onCheck = (ID: number) => {
    // TODO
  };
  const onAddressChange = (ID: number, address: SelectOption) => {
    // TODO
  };
  const checkbox = (key: string) => {
    const checked = isChecked.get(key) ?? false;
    return (
      <Checkbox
        className={'ml-1 mr-1 mt-[9px]'}
        checked={checked}
        onCheckedChange={() =>
          setIsChecked((oldValue) => {
            const newValue = new Map(oldValue);
            newValue.set(key, !checked);
            return newValue;
          })
        }
      ></Checkbox>
    );
  };
  return (
    <div>
      <Modal
        {...props}
        onRequestClose={onClose}
        title="Выбор прошивок для загрузки"
        onSubmit={handleSubmit}
      >
        <div className="flex gap-2 pl-4">
          <div className="flex h-60 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {[...Object.entries(stateMachinesId)].map(
              ([id, sm]) =>
                id && (
                  <div key={id} className="flex items-start">
                    {checkbox(id)}
                    <label className="'w-full placeholder:text-border-primary' w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors">
                      {sm.name ? sm.name : id}
                    </label>
                  </div>
                )
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
