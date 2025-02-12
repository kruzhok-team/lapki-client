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

interface FlasherTableProps {
  addressBookSetting: AddressData[] | null;
  stateMachineAddresses: Map<string, number>;
  assignStateMachineToAddress: (smId: string, idx: number) => void;
  setSelectedFirmwares: Dispatch<SetStateAction<SelectedMsFirmwaresType[]>>;
  isOpen: boolean;
  onClose: () => void;
}

// размеры столбцов
const checkColumn = 'w-[20px]';
const nameColumn = 'w-[165px]';
const typeColumn = 'w-[165px]';
const addressColumn = 'w-[160px]';
const firmwareSourceColumn = 'w-[210px]';
const selectSmSubColumn = 'w-[185px]';
const selectFileSubColumn = 'w-[25px]';

const tableClassName =
  'flex h-60 overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb';

export const FlasherTable: React.FC<FlasherTableProps> = ({
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
    const [cancleld, filePath, basename] = await window.api.fileHandlers.selectFile('bin файлы', [
      'bin',
    ]);
    if (!cancleld) {
      if (
        fileList.find((v) => {
          return v.ID === filePath;
        }) !== undefined
      ) {
        return;
      }
      const newFile: FirmwareItem = {
        ID: filePath,
        isFile: true,
        name: basename.substring(0, basename.lastIndexOf('.')),
      };
      setFileList([...fileList, newFile]);
    }
  };

  const cellRender = (content: string | JSX.Element, mergeClassName: string) => {
    return (
      <div
        className={twMerge(
          mergeClassName,
          'rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors'
        )}
      >
        {content}
      </div>
    );
  };

  const headerRender = () => {
    return (
      <div className="flex">
        {cellRender(' ', twMerge(checkColumn))}
        {cellRender('Наименование', nameColumn)}
        {cellRender('Тип', typeColumn)}
        {cellRender('Адрес/Порт', addressColumn)}
        {cellRender('Что прошиваем', firmwareSourceColumn)}
      </div>
    );
  };

  const rowRender = (firmware: FirmwareItem) => {
    const checked = checkedAll || (isChecked.get(firmware.ID) ?? true);
    return (
      <div key={firmware.ID} className="flex items-start">
        <Checkbox
          className={twMerge('h-[38px] rounded border border-border-primary', checkColumn)}
          checked={checked}
          onCheckedChange={() => {
            if (checkedAll) {
              setIsChecked(() => {
                const newMap = new Map();
                firmwareList.forEach((item) => {
                  newMap.set(item.ID, item.ID !== firmware.ID);
                });
                return newMap;
              });
              setCheckedAll(!checkedAll);
              return;
            }
            setIsChecked((oldValue) => {
              const newValue = new Map(oldValue);
              newValue.set(firmware.ID, !checked);
              return newValue;
            });
          }}
        />
        {cellRender(<label>{firmware.name ? firmware.name : firmware.ID}</label>, nameColumn)}
        {cellRender(
          <label>{firmware ? (firmware.isFile ? 'Файл' : firmware.type) : 'Тип'}</label>,
          typeColumn
        )}
        {cellRender(<label>{firmware.ID}</label>, addressColumn)}
        <Select
          options={
            firmware.isFile
              ? allAddressOptions
              : addressOptions.get(platformWithoutVersion(firmware.type))
          }
          className={selectSmSubColumn}
          isSearchable={false}
          placeholder="Выберите..."
          noOptionsMessage={() => 'Нет подходящих адресов'}
          value={assignedStateMachineOption(firmware.ID) as SelectOption}
          onChange={(opt) => {
            assignStateMachineToAddress(firmware.ID, Number(opt?.value));
          }}
        />
        <button
          type="button"
          className={twMerge('h-[38px] rounded border border-border-primary', selectFileSubColumn)}
        >
          …
        </button>
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
        <div className="flex h-60 flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {headerRender()}
          {firmwareList.map((firmware) => firmware.ID && rowRender(firmware))}
        </div>
      </Modal>
    </div>
  );
};
