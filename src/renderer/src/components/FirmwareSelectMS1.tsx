import { Dispatch, SetStateAction, useState } from 'react';

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
  setSelectedFirmwares,
  onClose,
  ...props
}) => {
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
  const [checkedAll, setCheckedAll] = useState<boolean>(true);
  const handleClose = () => {
    if (addressBookSetting === null) {
      return;
    }
    const submitFirmwares: SelectedMsFirmwaresType[] = [];
    const checks = isChecked;
    if (checkedAll) {
      stateMachinesId.forEach(([smId]) => {
        checks.set(smId, true);
      });
    }
    stateMachinesId.forEach(([smId]) => {
      if (checks.get(smId) ?? true) {
        const addressIndex = stateMachineAddresses.get(smId);
        if (addressIndex === undefined) {
          return;
        }
        submitFirmwares.push({
          isFile: false,
          source: smId,
        });
      }
    });
    setSelectedFirmwares(submitFirmwares);
    onClose();
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
  }
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
  const rowRender = (smId: string | null = null, sm: StateMachine | null = null) => {
    const checked = checkedAll || (smId ? isChecked.get(smId) ?? true : false);
    const textCellClassName =
      "'w-full placeholder:text-border-primary' w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors";
    return (
      <div key={smId}>
        <div className="flex w-full items-start">
          <Checkbox
            className={twMerge('ml-1 mr-1 mt-[9px]', !smId && 'opacity-0')}
            checked={checked}
            onCheckedChange={() => {
              if (!smId) return;
              if (checkedAll) {
                setIsChecked(() => {
                  const newMap = new Map();
                  stateMachinesId.forEach(([curSmId]) => {
                    newMap.set(curSmId, curSmId !== smId);
                  });
                  return newMap;
                });
                setCheckedAll(!checkedAll);
                return;
              }
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
              options={addressOptions.get(platformWithoutVersion(sm.platform)) ?? noPlatformOptions}
              className="w-52"
              isSearchable={false}
              placeholder="Выберите адрес..."
              noOptionsMessage={() => 'Нет подходящих адресов'}
              value={assignedStateMachineOption(smId) as SelectOption}
              onChange={(opt) => {
                assignStateMachineToAddress(smId, Number(opt?.value));
              }}
            ></Select>
          ) : (
            <label className={twMerge(textCellClassName, 'w-56')}>{'Адрес'}</label>
          )}
        </div>
      </div>
    );
  };
  return (
    <div>
      <Modal
        {...props}
        onRequestClose={handleClose}
        title="Выбор прошивок для загрузки"
        cancelLabel="Вернуться"
      >
        <div className="flex gap-2 pl-4">
          <div className="flex h-60 w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {rowRender(null, null)}
            {stateMachinesId.map(([id, sm]) => id && rowRender(id, sm))}
            {stateMachinesId.length !== 0 && (
              <div className="flex items-start">
                <Checkbox
                  className={'ml-1 mr-1 mt-[9px]'}
                  checked={checkedAll}
                  onCheckedChange={() => {
                    if (!checkedAll) {
                      setIsChecked(new Map());
                    } else {
                      setIsChecked(() => {
                        const newMap = new Map();
                        stateMachinesId.forEach(([smId]) => {
                          newMap.set(smId, false);
                        });
                        return newMap;
                      });
                    }
                    setCheckedAll(!checkedAll);
                  }}
                ></Checkbox>
                <label className="mt-[9px]">{'Выбрать всё'}</label>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
