import { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Device } from '@renderer/components/Modules/Device';
import { Checkbox, Select, SelectOption } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { useFlasher } from '@renderer/store/useFlasher';
import { StateMachine } from '@renderer/types/diagram';
import { AddressData, FirmwareTargetType, FlashTableItem } from '@renderer/types/FlasherTypes';

interface FlasherTableProps {
  getEntryById: (ID: number) => AddressData | undefined;
  addressEnrtyEdit: (data: AddressData) => void;
}

// размеры столбцов
// tailwind почему-то не реагирует на название классов, в которые подставленны переменные (`w-[${v}vw]`),
// поэтому при изменение стобцов приходится всё в ручную пересчитывать
const checkColumn = twMerge('w-[2vw]', 'rounded border border-border-primary');
const nameColumn = 'w-[18vw]';
const typeColumn = 'w-[18vw]';
const addressColumn = 'w-[18vw]';
const firmwareSourceColumn = 'w-[20vw]';
const selectSmSubColumn = 'w-[18vw]';
const selectFileSubColumn = 'w-[2vw]';
const allColumn = 'w-[76vw]';
// высота клеток
const cellHeight = 'h-[38px]';

export const FlasherTable: React.FC<FlasherTableProps> = ({
  getEntryById,
  addressEnrtyEdit,
  ...props
}) => {
  const modelController = useModelContext();

  const stateMachinesId = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };

  const { devices, flashTableData: tableData, setFlashTableData: setTableData } = useFlasher();

  const [checkedAll, setCheckedAll] = useState<boolean>(true);
  const [fileBaseName, setFileBaseName] = useState<Map<number | string, string>>(new Map());

  const stateMachineOption = (sm: StateMachine | null | undefined, smId: string) => {
    if (!sm) return null;
    return {
      value: smId,
      label: sm.name ?? smId,
    };
  };

  const getAssignedStateMachineOption = (tableItem: FlashTableItem) => {
    const source = tableItem.source;
    if (source === undefined || tableItem.isFile) return null;
    return stateMachineOption(stateMachinesId[source], source);
  };

  const platformWithoutVersion = (platform: string | undefined) => {
    if (!platform) return '';
    return platform.slice(0, platform.lastIndexOf('-'));
  };

  const stateMachineOptions = new Map<string, SelectOption[]>();
  const allAddressOptions: SelectOption[] = [];

  [...Object.entries(stateMachinesId)].forEach(([smId, sm]) => {
    if (!smId) return;
    let key: string = '';
    if (sm.platform.startsWith('tjc')) {
      key = platformWithoutVersion(sm.platform);
    } else {
      key = sm.platform;
    }
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

  const handleSelectFile = async (tableItem: FlashTableItem) => {
    const extensions = ['bin'];
    if (tableItem.targetType === FirmwareTargetType.arduino) {
      extensions.push('hex');
    }
    const [canceled, filePath, basename] = await window.api.fileHandlers.selectFile(
      'прошивки',
      extensions
    );
    if (canceled) return;
    setTableData(
      tableData.map((item) => {
        if (item.targetId === tableItem.targetId) {
          return {
            ...item,
            source: filePath,
            isFile: true,
          };
        }
        return item;
      })
    );
    setFileBaseName((oldMap) => {
      const newMap = new Map(oldMap);
      newMap.set(tableItem.targetId, basename);
      return newMap;
    });
  };

  const removeSource = (tableItem: FlashTableItem) => {
    setTableData(
      tableData.map((item) => {
        if (item.targetId === tableItem.targetId) {
          return {
            ...item,
            source: undefined,
            isFile: false,
          };
        }
        return item;
      })
    );
    if (tableItem.isFile) {
      setFileBaseName((oldMap) => {
        const newMap = new Map(oldMap);
        newMap.delete(tableItem.targetId);
        return newMap;
      });
    }
  };

  const onCheckedChangeHandle = (tableItem: FlashTableItem) => {
    if (checkedAll) {
      setCheckedAll(!checkedAll);
    }
    setTableData(
      tableData.map((item) => {
        if (item.targetId === tableItem.targetId) {
          return {
            ...item,
            isSelected: !tableItem.isSelected,
          };
        }
        return item;
      })
    );
  };

  const onSelectChangeHandle = (tableItem: FlashTableItem, smId: string) => {
    setTableData(
      tableData.map((item) => {
        if (item.targetId === tableItem.targetId) {
          return {
            ...item,
            source: smId,
            isFile: false,
          };
        }
        return item;
      })
    );
  };

  const changeCheckedAll = (newChecked: boolean) => {
    setCheckedAll(newChecked);
    setTableData(
      tableData.map((item) => {
        const newItem: FlashTableItem = {
          ...item,
          isSelected: newChecked,
        };
        return newItem;
      })
    );
  };

  const getArduinoDevicePlatform = (device: Device) => {
    // TODO: подумать, можно ли найти более надёжный способ сверки платформ на клиенте и сервере
    // названия платформ на загрузчике можно посмотреть здесь: https://github.com/kruzhok-team/lapki-flasher/blob/main/src/device_list.JSON
    const name = device.name.toLocaleLowerCase();
    switch (name) {
      case 'arduino micro':
      case 'arduino micro (bootloader)':
        return 'ArduinoMicro';
      case 'arduino uno':
        return 'ArduinoUno';
    }
    return undefined;
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
        <Checkbox
          className={twMerge(checkColumn, cellHeight)}
          checked={checkedAll && tableData.length > 0}
          onCheckedChange={() => changeCheckedAll(!checkedAll)}
          disabled={tableData.length === 0}
        />
        {cellRender('Наименование', nameColumn)}
        {cellRender('Тип', typeColumn)}
        {cellRender('Адрес', addressColumn)}
        {cellRender('Что прошиваем', firmwareSourceColumn)}
      </div>
    );
  };

  const rowRender = (tableItem: FlashTableItem) => {
    const checked = tableItem.isSelected;
    // Реализовать рендер для arduino
    let displayName: string = '…';
    let displayType: string = '…';
    let typeId: string | undefined = undefined;
    let displayAddress: string = '…';
    let addressData: AddressData | undefined = undefined;
    if (tableItem.targetType === FirmwareTargetType.tjc_ms) {
      addressData = getEntryById(tableItem.targetId as number);
      if (!addressData) {
        return;
      }
      displayName = addressData.name ? addressData.name : 'Не указано';
      displayType = addressData.type ? addressData.type : 'Неизвестно';
      typeId = addressData.type ? platformWithoutVersion(addressData.type) : undefined;
      displayAddress = addressData.address;
    } else if (tableItem.targetType === FirmwareTargetType.arduino) {
      const dev = devices.get(tableItem.targetId as string);
      if (!dev) {
        return;
      }
      displayName = dev.displayName();
      typeId = getArduinoDevicePlatform(dev);
    } else {
      throw Error(`Плата не поддерживается: ${tableItem}`);
    }
    return (
      <div key={tableItem.targetId} className="flex items-start">
        <Checkbox
          className={twMerge(checkColumn, cellHeight)}
          checked={checked}
          onCheckedChange={() => onCheckedChangeHandle(tableItem)}
        />
        {cellRender(
          <label
            onClick={() => {
              if (addressData) {
                addressEnrtyEdit(addressData);
              }
            }}
          >
            {displayName}
          </label>,
          nameColumn
        )}
        {cellRender(<label>{displayType}</label>, typeColumn)}
        {cellRender(<label>{displayAddress}</label>, addressColumn)}
        {/* (Roundabout1) TODO: центрировать текст опций в выпадающем списке и текстовом поле */}
        {tableItem.isFile ? (
          <div
            className={twMerge(
              selectSmSubColumn,
              cellHeight,
              'rounded border border-border-primary bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors'
            )}
          >
            {fileBaseName.get(tableItem.targetId) ?? 'Ошибка!'}
          </div>
        ) : (
          <Select
            options={typeId ? stateMachineOptions.get(typeId) : allAddressOptions}
            containerClassName={selectSmSubColumn}
            menuPosition="fixed"
            isSearchable={false}
            placeholder="Выберите..."
            noOptionsMessage={() => 'Нет подходящих машин состояний'}
            value={getAssignedStateMachineOption(tableItem) as SelectOption}
            onChange={(opt) => {
              if (opt?.value === undefined) return;
              onSelectChangeHandle(tableItem, opt.value);
            }}
            menuPlacement="auto"
          />
        )}
        <button
          type="button"
          className={twMerge(
            'rounded border border-border-primary',
            selectFileSubColumn,
            cellHeight
          )}
          onClick={() => (tableItem.source ? removeSource(tableItem) : handleSelectFile(tableItem))}
        >
          {tableItem.source ? '✖' : '…'}
        </button>
      </div>
    );
  };

  return (
    <div
      {...props}
      className="flex max-h-60 flex-col overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
    >
      {headerRender()}
      {tableData.length > 0
        ? tableData.map((tableItem) => rowRender(tableItem))
        : cellRender(
            'Добавьте устройства через кнопку «Подключить плату» или кнопку «Адреса плат МС-ТЮК»',
            twMerge(allColumn, 'opacity-70')
          )}
    </div>
  );
};
