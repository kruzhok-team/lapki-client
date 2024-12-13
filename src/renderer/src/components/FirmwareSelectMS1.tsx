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
  selectedFirmwares: SelectedMsFirmwaresType[];
  setSelectedFirmwares: Dispatch<SetStateAction<SelectedMsFirmwaresType[]>>;
  isOpen: boolean;
  onClose: () => void;
}

export const FlashSelect: React.FC<FlashSelectMS1Props> = ({
  addressBookSetting,
  stateMachineAddresses,
  assignStateMachineToAddress,
  setSelectedFirmwares,
  selectedFirmwares,
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
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [isChecked, setIsChecked] = useState<Map<string, boolean>>(new Map());
  const [checkedAll, setCheckedAll] = useState<boolean>(true);
  const restoreChecks = () => {
    const resValue = new Map<string, boolean>();
    if (selectedFirmwares) {
      selectedFirmwares.forEach((item) => {
        resValue.set(item.firmware.source, true);
      });
    }
    setIsChecked(resValue);
    if (checkedAll && selectedFirmwares.length !== stateMachinesId.length) {
      setCheckedAll(false);
    }
  };
  const closeWithChecks = () => {
    setErrors(new Map());
    onClose();
    restoreChecks();
  };
  const handleSubmit = hookHandleSubmit(() => {
    if (addressBookSetting === null) {
      closeWithChecks();
      return;
    }
    const submitFirmwares: SelectedMsFirmwaresType[] = [];
    const checks = isChecked;
    if (checkedAll) {
      stateMachinesId.forEach(([smId]) => {
        checks.set(smId, true);
      });
    }
    let canSubmit = true;
    checks.forEach((checked: boolean, smId: string) => {
      if (checked) {
        const addressIndex = stateMachineAddresses.get(smId);
        if (addressIndex === undefined) {
          setErrors((oldValue) => {
            canSubmit = false;
            const newValue = new Map(oldValue);
            newValue.set(smId, 'Выберите адрес или уберите галочку');
            return newValue;
          });
          return;
        }
        submitFirmwares.push({
          addressInfo: addressBookSetting[addressIndex],
          firmware: {
            isFile: false,
            source: smId,
          },
        });
      }
    });
    if (canSubmit) {
      setErrors(new Map());
      setSelectedFirmwares(submitFirmwares);
      onClose();
    }
  });
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
  const clearError = (smId: string) => {
    setErrors((oldValue) => {
      const newValue = new Map(oldValue);
      newValue.set(smId, '');
      return newValue;
    });
  };
  const rowRender = (smId: string | null = null, sm: StateMachine | null = null) => {
    const checked = checkedAll || (smId ? isChecked.get(smId) ?? false : false);
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
                    if (isChecked.get(curSmId) && errors.get(smId)) {
                      clearError(smId);
                    }
                    newMap.set(curSmId, curSmId !== smId);
                  });
                  return newMap;
                });
                setCheckedAll(!checkedAll);
                return;
              }
              if (checked && errors.get(smId)) {
                clearError(smId);
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
                if (errors.get(smId)) {
                  clearError(smId);
                }
              }}
            ></Select>
          ) : (
            <label className={twMerge(textCellClassName, 'w-56')}>{'Адрес'}</label>
          )}
        </div>
        <p className="pl-[120px] text-sm text-error">{smId ? errors.get(smId) : ''}</p>
      </div>
    );
  };
  return (
    <div>
      <Modal
        {...props}
        onRequestClose={() => closeWithChecks(selectedFirmwares)}
        title="Выбор прошивок для загрузки"
        onSubmit={handleSubmit}
        submitLabel="Выбрать"
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
                    setIsChecked(new Map());
                    setCheckedAll(!checkedAll);
                    setErrors(new Map());
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
