import { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as SelectFileIcon } from '@renderer/assets/icons/upload-file.svg';
import { BlgMbDevice } from '@renderer/components/Modules/Device';
import { ManagerMS } from '@renderer/components/Modules/ManagerMS';
import {
  Checkbox,
  ParameterSelect,
  ParameterSelectOption,
  ScrollArea,
  WithHint,
} from '@renderer/components/UI';
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
const checkColumn = 'w-7 min-w-7';
const stickyStyle = 'sticky top-0 z-10';
const selectSmSubColumn = 'h-full w-full min-w-0';
const checkColumnSize = 28;
const selectFileColumnSize = 24;
// высота клеток
const cellHeight = 'min-h-9';
const cellBorder = 'border-b border-r border-border-primary';

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

  const [fileBaseName, setFileBaseName] = useState<Map<number | string, string>>(new Map());
  const [stateMachineOptions, setStateMachineOptions] = useState<
    Map<string, ParameterSelectOption<string>[]>
  >(new Map());
  const [allAddressOptions, setAllAddressOptions] = useState<ParameterSelectOption<string>[]>([]);

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
    setTableData(
      tableData.map((item) => {
        if (item.source) return item;
        return {
          ...item,
          source: defaultSm(getTypeID(item)),
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateMachineOptions, allAddressOptions, tableData.length]);

  const getTypeID = (item: FlashTableItem) => {
    if (item.targetType === FirmwareTargetType.dev) {
      const dev = devices.get(item.targetId as string);
      if (!dev) return null;
      return ManagerMS.getDevicePlatform(dev) ?? null;
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

  const defaultSm = (typeId: string | null) => {
    const options = typeId ? stateMachineOptions.get(typeId) : allAddressOptions;
    if (!options) return undefined;
    if (options.length === 1) {
      return options[0].value;
    }
    return undefined;
  };

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

  const handleRemoveFileSource = (tableItem: FlashTableItem) => {
    setFileBaseName((oldMap) => {
      const newMap = new Map(oldMap);
      newMap.delete(tableItem.targetId);
      return newMap;
    });

    setTableData(
      tableData.map((item) => {
        if (item.targetType === tableItem.targetType && item.targetId === tableItem.targetId) {
          return {
            ...item,
            source: defaultSm(getTypeID(tableItem)),
            isFile: false,
          };
        }
        return item;
      })
    );
  };

  const onCheckedChangeHandle = (tableItem: FlashTableItem) => {
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

  const cellRender = (content: string | JSX.Element, mergeClassName: string, colspan?: number) => {
    return (
      <td
        className={twMerge(
          mergeClassName,
          cellHeight,
          cellBorder,
          'px-[9px] py-[6px] text-center text-text-primary outline-none transition-colors'
        )}
        colSpan={colspan}
      >
        {content}
      </td>
    );
  };

  const headerRender = () => {
    return (
      <tr className={twMerge(stickyStyle, 'items-center justify-start font-medium')}>
        <td className={twMerge(stickyStyle, checkColumn)} />
        {cellRender('Наименование', twMerge(stickyStyle, 'rounded-tl-[6px] border-l border-t'))}
        {cellRender('Тип', twMerge(stickyStyle, 'border-t'))}
        {cellRender('Адрес', twMerge(stickyStyle, 'border-t'))}
        {cellRender('Что прошиваем', twMerge(stickyStyle, 'rounded-tr-[6px] border-t'), 2)}
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
      typeId = ManagerMS.getDevicePlatform(dev);
      if (dev.isBlgMbDevice()) {
        const BlgMbDev = dev as BlgMbDevice;
        displayType = BlgMbDev.version;
      }
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
          <Checkbox checked={checked} onCheckedChange={() => onCheckedChangeHandle(tableItem)} />
        </td>
        {devInfoDisplay(displayName, 'border-l')}
        {devInfoDisplay(displayType, '')}
        {devInfoDisplay(displayAddress, '')}
        {/* (Roundabout1) TODO: центрировать текст опций в выпадающем списке и текстовом поле */}
        <td className={twMerge(cellHeight, cellBorder, 'h-9')}>
          {tableItem.isFile ? (
            <div
              className={twMerge(
                selectSmSubColumn,
                cellHeight,
                'bg-transparent px-[9px] py-[6px] text-text-primary outline-none transition-colors'
              )}
            >
              {fileBaseName.get(tableItem.targetId) ?? 'Ошибка!'}
            </div>
          ) : (
            <ParameterSelect
              options={typeId ? stateMachineOptions.get(typeId) : allAddressOptions}
              containerClassName={twMerge(
                selectSmSubColumn,
                '[&>div]:h-full [&>div>div]:!h-full [&>div>div]:!min-h-0 [&>div>div]:!rounded-none [&>div>div]:!border-0'
              )}
              menuWidth="content"
              menuPosition="fixed"
              isSearchable={false}
              placeholder="Выберите..."
              noOptionsMessage={() => 'Нет подходящих машин состояний'}
              value={
                getAssignedStateMachineOption(tableItem) as ParameterSelectOption<string> | null
              }
              onChange={(opt) => {
                if (opt?.value === undefined) return;
                onSelectChangeHandle(tableItem, opt.value);
              }}
              menuPlacement="auto"
            />
          )}
        </td>
        <td
          className="h-9"
          style={{
            width: selectFileColumnSize,
            minWidth: selectFileColumnSize,
            maxWidth: selectFileColumnSize,
          }}
        >
          <WithHint
            hint={
              tableItem.isFile
                ? 'Убрать файл из таблицы.'
                : 'Выбрать файл с прошивкой для загрузки в плату.'
            }
            placement="left"
          >
            {(hintProps) => (
              <button
                {...hintProps}
                type="button"
                className="block size-6 p-0"
                onClick={() =>
                  tableItem.isFile ? handleRemoveFileSource(tableItem) : handleSelectFile(tableItem)
                }
              >
                {tableItem.isFile ? '✖' : <SelectFileIcon className="size-6 opacity-70" />}
              </button>
            )}
          </WithHint>
        </td>
      </tr>
    );
  };

  return (
    <ScrollArea
      {...props}
      className="max-h-60 py-0"
      viewportClassName="mr-[6px]"
      horizontalScroll={false}
    >
      {tableData.length > 0 ? (
        <table className="w-full table-fixed border-separate border-spacing-0">
          <colgroup>
            <col style={{ width: checkColumnSize }} />
            <col />
            <col />
            <col />
            <col />
            <col style={{ width: selectFileColumnSize }} />
          </colgroup>
          <thead className={twMerge(stickyStyle)}>{headerRender()}</thead>
          <tbody className="[&>tr:last-child>td:nth-child(2)]:rounded-bl-[6px] [&>tr:last-child>td:nth-child(5)]:rounded-br-[6px]">
            {tableData.map((tableItem) => rowRender(tableItem))}
          </tbody>
        </table>
      ) : (
        <div className="flex min-h-20 flex-col items-center justify-center">
          <label className="text-center opacity-70">
            Добавьте устройства через кнопку «Подключить плату» или кнопку «Адресная книга»
          </label>
        </div>
      )}
    </ScrollArea>
  );
};
