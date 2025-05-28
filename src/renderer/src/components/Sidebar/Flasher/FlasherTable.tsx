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
const checkColumn = twMerge('min-w-9', 'rounded border border-border-primary');
const stickyStyle = 'sticky top-0 z-10 bg-bg-secondary';
const nameColumn = 'min-w-[16vw]';
const typeColumn = 'min-w-[14vw]';
const addressColumn = 'min-w-[16vw]';
const firmwareSourceColumn = 'min-w-[20vw] flex-1';
const selectSmSubColumn = 'min-w-[18vw] flex-1';
const selectFileSubColumn = 'min-w-8';
// высота клеток
const cellHeight = 'min-h-9';

// список плат МС-ТЮК, которые следует строго проверять на соответствие версий.
const strictVersionCheck = ['mtrx'];

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
  const [stateMachineOptions, setStateMachineOptions] = useState<Map<string, SelectOption[]>>(
    new Map()
  );
  const [allAddressOptions, setAllAddressOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const newStateMachineOptions: typeof stateMachineOptions = new Map();
    const newAllAddressOptions: typeof allAddressOptions = [];
    // составление словаря, где ключ - это платформа, а значение - это список доступных на данный момент машин состояний на этой платформе
    // также здесь составляется список всех доступных платформ для выпадающего списка на случай, если тип платы неизвестен
    [...Object.entries(stateMachinesId)].forEach(([smId, sm]) => {
      if (!smId) return;
      let key: string = '';
      if (sm.platform.startsWith('tjc')) {
        if (isStrictVersionCheck(sm.platform)) {
          key = sm.platform;
        } else {
          key = platformWithoutVersion(sm.platform);
        }
      } else {
        key = sm.platform;
      }
      const value = newStateMachineOptions.get(key) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newStateMachineOptions.set(key, [...value, stateMachineOption(sm, smId)!]);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newAllAddressOptions.push(stateMachineOption(sm, smId)!);
    });

    const noPlatformOptions = newStateMachineOptions.get('');
    if (noPlatformOptions !== undefined) {
      for (const key of newStateMachineOptions.keys()) {
        if (key === '') continue;
        const options = newStateMachineOptions.get(key);
        if (options !== undefined) {
          newStateMachineOptions.set(key, options.concat(noPlatformOptions));
        }
      }
    }

    setStateMachineOptions(newStateMachineOptions);
    setAllAddressOptions(newAllAddressOptions);
  }, [stateMachinesId]);

  useEffect(() => {
    const getTypeID = (item: FlashTableItem) => {
      if (item.targetType === FirmwareTargetType.dev) {
        const dev = devices.get(item.targetId as string);
        if (!dev) return null;
        return getDevicePlatform(dev) ?? null;
      } else if (item.targetType === FirmwareTargetType.tjc_ms) {
        const addressData = getEntryById(item.targetId as number);
        if (!addressData) {
          return null;
        }
        const typeId = addressData.type ?? null;
        if (typeId && !isStrictVersionCheck(typeId)) {
          return platformWithoutVersion(typeId);
        }
        return typeId;
      }
      return null;
    };

    setTableData(
      tableData.map((item) => {
        if (item.source) return item;
        const typeId = getTypeID(item);
        const options = typeId ? stateMachineOptions.get(typeId) : allAddressOptions;
        if (!options) return item;
        if (options.length === 1) {
          return {
            ...item,
            source: options[0].value,
            isFile: false,
          };
        }
        return item;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateMachineOptions, allAddressOptions, tableData.length]);

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

  const isStrictVersionCheck = (platform: string) => {
    return strictVersionCheck.some((platformType) => {
      return platform.includes(`-${platformType}-`);
    });
  };

  const handleSelectFile = async (tableItem: FlashTableItem) => {
    const [canceled, filePath, basename] = await window.api.fileHandlers.selectFile(
      'прошивки',
      tableItem.extensions
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

  const getDevicePlatform = (device: Device) => {
    // TODO: подумать, можно ли найти более надёжный способ сверки платформ на клиенте и сервере
    // названия платформ на загрузчике можно посмотреть здесь: https://github.com/kruzhok-team/lapki-flasher/blob/main/src/device_list.JSON
    const name = device.name.toLocaleLowerCase();
    switch (name) {
      case 'arduino micro':
      case 'arduino micro (bootloader)':
        return 'ArduinoMicro';
      case 'arduino uno':
        return 'ArduinoUno';
      case 'кибермишка':
        return 'blg-mb-1-a7';
    }
    return undefined;
  };

  const cellRender = (content: string | JSX.Element, mergeClassName: string, colspan?: number) => {
    return (
      <td
        className={twMerge(
          mergeClassName,
          cellHeight,
          'rounded border border-border-primary px-[9px] py-[6px] text-center text-text-primary outline-none transition-colors'
        )}
        colSpan={colspan}
      >
        {content}
      </td>
    );
  };

  const headerRender = () => {
    return (
      <tr className={twMerge(stickyStyle, 'items-center justify-start font-semibold')}>
        <td className={stickyStyle}>
          <Checkbox
            className={twMerge(checkColumn, cellHeight)}
            checked={checkedAll && tableData.length > 0}
            onCheckedChange={() => changeCheckedAll(!checkedAll)}
            disabled={tableData.length === 0}
          />
        </td>
        {cellRender('Наименование', twMerge(stickyStyle, nameColumn))}
        {cellRender('Тип', twMerge(stickyStyle, typeColumn))}
        {cellRender('Адрес', twMerge(stickyStyle, addressColumn))}
        {cellRender('Что прошиваем', twMerge(stickyStyle, firmwareSourceColumn), 2)}
      </tr>
    );
  };

  // (Roundabout1) TODO: добавить поля для рендера в FlashTableItem (displayName, displayType и т.д.)
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
      typeId = addressData.type ?? undefined;
      if (typeId && !isStrictVersionCheck(typeId)) {
        typeId = platformWithoutVersion(typeId);
      }
      displayAddress = addressData.address;
    } else if (tableItem.targetType === FirmwareTargetType.dev) {
      const dev = devices.get(tableItem.targetId as string);
      if (!dev) {
        return;
      }
      displayName = dev.displayName();
      typeId = getDevicePlatform(dev);
    } else {
      throw Error(`Плата не поддерживается: ${tableItem}`);
    }
    const devInfoDisplay = (displayInfo: string, column: string) => {
      return cellRender(
        <label
          onDoubleClick={() => {
            if (addressData) {
              addressEnrtyEdit(addressData);
            }
          }}
          className={addressData ? 'cursor-pointer' : ''}
        >
          {displayInfo}
        </label>,
        column
      );
    };
    return (
      <tr key={tableItem.targetId}>
        <td>
          <Checkbox
            className={twMerge(checkColumn, cellHeight)}
            checked={checked}
            onCheckedChange={() => onCheckedChangeHandle(tableItem)}
          />
        </td>
        {devInfoDisplay(displayName, nameColumn)}
        {devInfoDisplay(displayType, typeColumn)}
        {devInfoDisplay(displayAddress, addressColumn)}
        {/* (Roundabout1) TODO: центрировать текст опций в выпадающем списке и текстовом поле */}
        <td>
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
        </td>
        <td>
          <button
            type="button"
            className={twMerge(
              'rounded border border-border-primary',
              selectFileSubColumn,
              cellHeight
            )}
            onClick={() =>
              tableItem.isFile ? removeSource(tableItem) : handleSelectFile(tableItem)
            }
          >
            {tableItem.isFile ? '✖' : '…'}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div
      {...props}
      className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
    >
      {tableData.length > 0 ? (
        <table className="w-full border-separate">
          <thead className={twMerge(stickyStyle, 'bg-secondary font-semibold')}>
            {headerRender()}
          </thead>
          <tbody>{tableData.map((tableItem) => rowRender(tableItem))}</tbody>
        </table>
      ) : (
        <div className="flex min-h-20 flex-col items-center justify-center">
          <label className="text-center opacity-70">
            Добавьте устройства через кнопку «Подключить плату» или кнопку «Адреса плат МС-ТЮК»
          </label>
        </div>
      )}
    </div>
  );
};
