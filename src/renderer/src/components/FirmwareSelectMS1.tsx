import { Dispatch, SetStateAction, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Checkbox, Modal, Select, SelectOption } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';
import { AddressData, SelectedMsFirmwaresType } from '@renderer/types/FlasherTypes';

type FirmwareItem = {
  ID: string;
  name?: string;
  isFile: boolean;
  type?: string;
};

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
  const allAddressOptions: SelectOption[] = [];
  const [isChecked, setIsChecked] = useState<Map<string, boolean>>(new Map());
  const [checkedAll, setCheckedAll] = useState<boolean>(true);
  const [fileList, setFileList] = useState<FirmwareItem[]>([]);

  const firmwareList = Array.from(stateMachinesId, ([smId, sm]) => {
    const newItem: FirmwareItem = {
      ID: smId,
      name: sm.name,
      isFile: false,
      type: sm.platform,
    };
    return newItem;
  });
  firmwareList.push(...fileList);

  const handleClose = () => {
    if (addressBookSetting === null) {
      return;
    }
    const submitFirmwares: SelectedMsFirmwaresType[] = [];
    const checks = isChecked;
    if (checkedAll) {
      firmwareList.forEach((item) => {
        checks.set(item.ID, true);
      });
    }
    firmwareList.forEach((item) => {
      if (checks.get(item.ID) ?? true) {
        const addressIndex = stateMachineAddresses.get(item.ID);
        if (addressIndex === undefined) {
          return;
        }
        submitFirmwares.push({
          isFile: item.isFile,
          source: item.ID,
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      allAddressOptions.push(stateMachineOption(entry, index)!);
    });
  }

  console.log('all adress', allAddressOptions);

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

  const handleAddFile = async () => {
    const [filePath] = await window.api.fileHandlers.selectFile('bin файлы', ['bin']);
    if (filePath) {
      const filePathWitoutExtension = filePath.substring(0, filePath.lastIndexOf('.'));
      let nameIndex = filePathWitoutExtension.lastIndexOf('/');
      if (nameIndex === -1) {
        nameIndex = filePathWitoutExtension.lastIndexOf('\\');
      }
      const newFile: FirmwareItem = {
        ID: filePath,
        isFile: true,
        name: filePathWitoutExtension.substring(nameIndex + 1),
      };
      setFileList([...fileList, newFile]);
    }
  };

  const rowRender = (firmware: FirmwareItem | null = null) => {
    const ID = firmware ? firmware.ID : null;
    const checked = checkedAll || (ID ? isChecked.get(ID) ?? true : false);
    const textCellClassName =
      "'w-full placeholder:text-border-primary' w-[250px] rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors";
    return (
      <div key={ID}>
        <div className="flex w-full items-start">
          <Checkbox
            className={twMerge('ml-1 mr-1 mt-[9px]', !ID && 'opacity-0')}
            checked={checked}
            onCheckedChange={() => {
              if (!ID) return;
              if (checkedAll) {
                setIsChecked(() => {
                  const newMap = new Map();
                  firmwareList.forEach((item) => {
                    newMap.set(item.ID, item.ID !== ID);
                  });
                  return newMap;
                });
                setCheckedAll(!checkedAll);
                return;
              }
              setIsChecked((oldValue) => {
                const newValue = new Map(oldValue);
                newValue.set(ID, !checked);
                return newValue;
              });
            }}
            disabled={!ID}
          ></Checkbox>
          <label className={textCellClassName}>
            {firmware ? (firmware.name ? firmware.name : ID) : 'Машина состояний'}
          </label>
          <label className={textCellClassName}>
            {firmware ? (firmware.isFile ? 'Файл' : firmware.type) : 'Тип'}
          </label>
          {ID && firmware ? (
            <Select
              options={
                firmware.isFile
                  ? allAddressOptions
                  : addressOptions.get(platformWithoutVersion(firmware.type))
              }
              className="w-52"
              isSearchable={false}
              placeholder="Выберите адрес..."
              noOptionsMessage={() => 'Нет подходящих адресов'}
              value={assignedStateMachineOption(ID) as SelectOption}
              onChange={(opt) => {
                assignStateMachineToAddress(ID, Number(opt?.value));
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
            {rowRender(null)}
            {firmwareList.map((firmware) => firmware.ID && rowRender(firmware))}
            <button
              type="button"
              className="btn-secondary ml-[28px] mt-[1px] border-border-primary"
              onClick={() => handleAddFile()}
            >
              Добавить файл с прошивкой
            </button>
            {firmwareList.length !== 0 && (
              <div className="flex items-start">
                <Checkbox
                  className={'ml-1 mr-1 mt-[4px]'}
                  checked={checkedAll}
                  onCheckedChange={() => {
                    if (!checkedAll) {
                      setIsChecked(new Map());
                    } else {
                      setIsChecked(() => {
                        const newMap = new Map();
                        firmwareList.forEach((firmware) => {
                          newMap.set(firmware.ID, false);
                        });
                        return newMap;
                      });
                    }
                    setCheckedAll(!checkedAll);
                  }}
                ></Checkbox>
                <label className="mt-[4px]">{'Выбрать всё'}</label>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
