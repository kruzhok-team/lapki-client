import { Dispatch, SetStateAction, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Checkbox, Select, SelectOption } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';
import { AddressData, FlashTableItem } from '@renderer/types/FlasherTypes';

interface FlasherTableProps {
  tableData: FlashTableItem[];
  setTableData: Dispatch<SetStateAction<FlashTableItem[]>>;
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
const selectSmSubColumn = 'w-[20vw]';
//const selectFileSubColumn = 'w-[2vw]';
const allColumn = 'w-[76vw]';
// высота клеток
const cellHeight = 'h-[38px]';

export const FlasherTable: React.FC<FlasherTableProps> = ({
  tableData,
  setTableData,
  getEntryById,
  addressEnrtyEdit,
  ...props
}) => {
  const modelController = useModelContext();

  const stateMachinesId = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };

  // TODO: (Roundabout1): удалить фильтр (при объединении arduino-загрузчика с менеджером МС-ТЮК)
  const stateMachinesArray = [...Object.entries(stateMachinesId)].filter(([, sm]) => {
    return sm.platform.startsWith('tjc');
  });

  //const [stateMachineAddresses, setStateMachineAddresses] = useState<Map<<>>(new Map());
  const [checkedAll, setCheckedAll] = useState<boolean>(true);

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

  // const handleAddFile = async () => {
  //   // const [cancleld, filePath, basename] = await window.api.fileHandlers.selectFile('bin файлы', [
  //   //   'bin',
  //   // ]);
  //   // if (!cancleld) {
  //   //   if (
  //   //     fileList.find((v) => {
  //   //       return v.ID === filePath;
  //   //     }) !== undefined
  //   //   ) {
  //   //     return;
  //   //   }
  //   //   const newFile: FirmwareItem = {
  //   //     ID: filePath,
  //   //     isFile: true,
  //   //     name: basename.substring(0, basename.lastIndexOf('.')),
  //   //   };
  //   //   setFileList([...fileList, newFile]);
  //   // }
  // };

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
          checked={checkedAll}
          onCheckedChange={() => changeCheckedAll(!checkedAll)}
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
    const addressData = getEntryById(tableItem.targetId);
    if (addressData === undefined) return;
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
              addressEnrtyEdit(addressData);
            }}
          >
            {addressData.name ? addressData.name : 'Не указано'}
          </label>,
          nameColumn
        )}
        {cellRender(
          <label>{addressData.type ? addressData.type : 'Неизвестно'}</label>,
          typeColumn
        )}
        {cellRender(<label>{addressData.address}</label>, addressColumn)}
        <Select
          options={
            stateMachineOptions.get(platformWithoutVersion(addressData.type)) ?? allAddressOptions
          }
          containerClassName={selectSmSubColumn}
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
      {tableData.length > 0
        ? tableData.map((tableItem) => rowRender(tableItem))
        : cellRender(
            'Добавьте устройства через кнопку «Подключить плату» или кнопку «Адреса плат МС-ТЮК»',
            twMerge(allColumn, 'opacity-70')
          )}
    </div>
  );
};
