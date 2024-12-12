import { Dispatch, SetStateAction, useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Checkbox, Modal, Select, SelectOption } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';
import { AddressData, SelectedMsFirmwaresType } from '@renderer/types/FlasherTypes';

interface FlashSelectMS1Props {
  addressBookSetting: AddressData[] | null;
  stateMachineAddresses: Map<string, number>;
  assignStateMachineToAddress: (smId: string, idx: number) => void;
  setSelectedFirmwares: Dispatch<SetStateAction<SelectedMsFirmwaresType[]>>;
  isOpen: boolean;
  onClose: () => void;
}

export const FlashSelect: React.FC<FlashSelectMS1Props> = ({
  addressBookSetting,
  stateMachineAddresses,
  assignStateMachineToAddress,
  onClose,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm();
  const modelController = useModelContext();
  const stateMachinesId = [
    ...Object.entries(
      modelController.model.useData('', 'elements.stateMachinesId') as {
        [ID: string]: StateMachine;
      }
    ),
  ].filter(([, sm]) => {
    return sm.platform.startsWith('tjc');
  });
  const addressOptions = new Map<string, SelectOption[]>();
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
    if (addressBookSetting === null) {
      onClose();
      return;
    }
    const submitFirmwares: SelectedMsFirmwaresType[] = [];
    isChecked.forEach((checked: boolean, smId: string) => {
      if (checked) {
        const addressIndex = stateMachineAddresses.get(smId);
        if (addressIndex === undefined) {
          return;
        }
        submitFirmwares.push({
          address: addressBookSetting[addressIndex].address,
          firmware: {
            isFile: false,
            source: smId,
          },
        });
      }
    });
    onClose();
  });
  const onCheck = (ID: number) => {
    // TODO
  };
  const onAddressChange = (ID: number, address: SelectOption) => {
    // TODO
  };

  const stateMachineOption = (addressData: AddressData | null | undefined, index: number) => {
    if (!addressData) return null;
    return {
      value: '' + index,
      label: addressData.name ? addressData.name : addressData.address,
    };
  };

  const assignedStateMachineOption = (smId: string) => {
    if (addressBookSetting === null) return null;
    const index = stateMachineAddresses.get(smId);
    if (index === undefined) return null;
    return stateMachineOption(addressBookSetting[index], index);
  };

  const platformWithoutVersion = (platform: string | undefined) => {
    if (!platform) return '';
    return platform.slice(0, platform.lastIndexOf('-'));
  };

  if (addressBookSetting !== null) {
    addressBookSetting.forEach((entry, index) => {
      const key = platformWithoutVersion(entry.type);
      const value = addressOptions.get(key) ?? [];
      // здесь null не будет, так как мы уже делаем проверку addressBookSetting
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      addressOptions.set(key, [...value, stateMachineOption(entry, index)!]);
    });
    const noPlatformOptions = addressOptions.get('');
    if (noPlatformOptions !== undefined) {
      for (const key of addressOptions.keys()) {
        if (key === '') continue;
        const options = addressOptions.get(key);
        if (options !== undefined) {
          addressOptions.set(key, options.concat(noPlatformOptions));
        }
      }
    }
  }
  const rowRender = (smId: string | null = null, sm: StateMachine | null = null) => {
    const checked = smId ? isChecked.get(smId) ?? false : false;
    const textCellClassName =
      "'w-full placeholder:text-border-primary' w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors";
    return (
      <div key={smId} className="flex w-full items-start">
        <Checkbox
          className={twMerge('ml-1 mr-1 mt-[9px]', !smId && 'opacity-0')}
          checked={checked}
          onCheckedChange={() => {
            if (!smId) return;
            setIsChecked((oldValue) => {
              const newValue = new Map(oldValue);
              newValue.set(smId, !checked);
              return newValue;
            });
          }}
          disabled={!smId}
        ></Checkbox>
        <label className={textCellClassName}>
          {sm ? (sm.name ? sm.name : smId) : 'Машина состояний'}
        </label>
        <label className={textCellClassName}>{sm ? sm.platform : 'Тип'}</label>
        {smId && sm ? (
          <Select
            options={addressOptions.get(platformWithoutVersion(sm.platform))}
            className="w-52"
            isSearchable={false}
            placeholder="Выберите адрес..."
            noOptionsMessage={() => 'Нет подходящих адресов'}
            value={assignedStateMachineOption(smId) as SelectOption}
            onChange={(opt) => assignStateMachineToAddress(smId, Number(opt?.value))}
          ></Select>
        ) : (
          <label className={twMerge(textCellClassName, 'w-56')}>{'Адрес'}</label>
        )}
      </div>
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
            {rowRender(null, null)}
            {stateMachinesId.map(([id, sm]) => id && rowRender(id, sm))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
