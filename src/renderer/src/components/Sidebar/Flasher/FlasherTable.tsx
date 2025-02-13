import { Dispatch, SetStateAction, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Checkbox, Select, SelectOption } from '@renderer/components/UI';
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
  stateMachineAddresses: Map<string, SelectedMsFirmwaresType>;
  setStateMachineAddresses: Dispatch<SetStateAction<Map<string, SelectedMsFirmwaresType>>>;
  checkedStateMachine: Map<string, boolean>;
  setCheckedStateMachine: Dispatch<SetStateAction<Map<string, boolean>>>;
  devList: AddressData[];
}

// размеры столбцов
// tailwind почему-то не реагирует на название классов, в которые подставленны переменные (`w-[${v}vw]`),
// поэтому при изменение стобцов приходится всё в ручную пересчитывать
const checkColumn = 'w-[2vw]';
const nameColumn = 'w-[18vw]';
const typeColumn = 'w-[18vw]';
const addressColumn = 'w-[18vw]';
const firmwareSourceColumn = 'w-[20vw]';
const selectSmSubColumn = 'w-[20vw]';
//const selectFileSubColumn = 'w-[2vw]';
const allColumn = 'w-[76vw]';
// высота клеток
const cellHeight = 'h-[38px]';

export const FlasherTable: React.FC<FlasherTableProps> = ({
  stateMachineAddresses,
  setStateMachineAddresses,
  checkedStateMachine: isChecked,
  setCheckedStateMachine: setIsChecked,
  devList,
  ...props
}) => {
  const modelController = useModelContext();

  const stateMachinesId = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };

  const stateMachinesArray = [...Object.entries(stateMachinesId)].filter(([, sm]) => {
    return sm.platform.startsWith('tjc');
  });

  const [checkedAll, setCheckedAll] = useState<boolean>(true);
  const [fileList, setFileList] = useState<FirmwareItem[]>([]);

  const firmwareList = Array.from(stateMachinesArray, ([smId, sm]) => {
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
          target: item.ID,
        });
      }
    });
    //setSelectedFirmwares(submitFirmwares);
  };

  const stateMachineOption = (sm: StateMachine | null | undefined, smId: string) => {
    if (!sm) return null;
    return {
      value: smId,
      label: sm.name ?? smId,
    };
  };

  const assignedStateMachineOption = (address: string) => {
    const v = stateMachineAddresses.get(address);
    if (v === undefined) return null;
    return stateMachineOption(stateMachinesId[v.target], v.target);
  };

  const platformWithoutVersion = (platform: string | undefined) => {
    if (!platform) return '';
    return platform.slice(0, platform.lastIndexOf('-'));
  };

  const stateMachineOptions = new Map<string, SelectOption[]>();
  const allAddressOptions: SelectOption[] = [];

  stateMachinesArray.forEach(([smId, sm]) => {
    const key = platformWithoutVersion(sm.platform);
    const value = stateMachineOptions.get(key) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    stateMachineOptions.set(key, [...value, stateMachineOption(sm, smId)!]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    allAddressOptions.push(stateMachineOption(sm, smId)!);
  });

  const noPlatformOptions = stateMachineOptions.get('');
  if (noPlatformOptions !== undefined) {
    for (const key of stateMachineOptions.keys()) {
      if (key === '') continue;
      const options = stateMachineOptions.get(key);
      if (options !== undefined) {
        stateMachineOptions.set(key, options.concat(noPlatformOptions));
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
          cellHeight,
          'rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-center text-text-primary outline-none transition-colors'
        )}
      >
        {content}
      </div>
    );
  };

  const headerRender = () => {
    return (
      <div className="flex">
        {cellRender(' ', checkColumn)}
        {cellRender('Наименование', nameColumn)}
        {cellRender('Тип', typeColumn)}
        {cellRender('Адрес', addressColumn)}
        {cellRender('Что прошиваем', firmwareSourceColumn)}
      </div>
    );
  };

  const rowRender = (devInfo: AddressData) => {
    const checked = checkedAll || (isChecked.get(devInfo.address) ?? true);
    return (
      <div key={devInfo.address} className="flex items-start">
        <Checkbox
          className={twMerge('rounded border border-border-primary', checkColumn, cellHeight)}
          checked={checked}
          onCheckedChange={() => {
            if (checkedAll) {
              setIsChecked(() => {
                const newMap = new Map();
                firmwareList.forEach((item) => {
                  newMap.set(item.ID, item.ID !== devInfo.address);
                });
                return newMap;
              });
              setCheckedAll(!checkedAll);
              return;
            }
            setIsChecked((oldValue) => {
              const newValue = new Map(oldValue);
              newValue.set(devInfo.address, !checked);
              return newValue;
            });
          }}
        />
        {cellRender(<label>{devInfo.name ? devInfo.name : 'Не указано'}</label>, nameColumn)}
        {cellRender(<label>{devInfo.type ? devInfo.type : 'Неизвестно'}</label>, typeColumn)}
        {cellRender(<label>{devInfo.address}</label>, addressColumn)}
        <Select
          options={
            stateMachineOptions.get(platformWithoutVersion(devInfo.type)) ?? allAddressOptions
          }
          containerClassName={selectSmSubColumn}
          isSearchable={false}
          placeholder="Выберите..."
          noOptionsMessage={() => 'Нет подходящих адресов'}
          value={assignedStateMachineOption(devInfo.address) as SelectOption}
          onChange={(opt) => {
            if (!opt?.value) return;
            setStateMachineAddresses((oldMap) => {
              const newMap = new Map(oldMap);
              newMap.set(devInfo.address, { target: opt?.value, isFile: false });
              return newMap;
            });
          }}
          menuPlacement="auto"
        />
      </div>
    );
  };

  /*
    <button
      type="button"
      className={twMerge(
        'rounded border border-border-primary',
        selectFileSubColumn,
        cellHeight
      )}
    >
      …
    </button>
  */

  return (
    <div
      {...props}
      className="flex max-h-60 min-h-60 flex-col overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
    >
      {headerRender()}
      {devList.length > 0
        ? devList.map((devInfo) => rowRender(devInfo))
        : cellRender(
            'Добавьте устройства через кнопку «Подключить плату» или кнопку «Адреса плат МС-ТЮК»',
            twMerge(allColumn, 'opacity-70')
          )}
    </div>
  );
};
