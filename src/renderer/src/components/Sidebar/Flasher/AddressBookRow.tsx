import { twMerge } from 'tailwind-merge';

import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as LensIcon } from '@renderer/assets/icons/metadata.svg';
import { WithHint } from '@renderer/components/UI';
import { DeleteButton } from '@renderer/components/UI/DeleteButton';
import { AddressData } from '@renderer/types/FlasherTypes';

interface AddressBookRowProps {
  data: AddressData;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMetaData: () => void;
  onRemove: () => void;
}
export const AddressBookRow: React.FC<AddressBookRowProps> = (props) => {
  const { data, isLast, onSelect, isSelected, onEdit, onMetaData, onRemove } = props;
  const cellClassName = twMerge(
    'min-h-9 truncate border-b border-r border-border-primary px-[9px] py-[6px] text-text-primary outline-none transition-colors group-hover:bg-bg-hover',
    isSelected && 'bg-bg-active group-hover:bg-bg-active'
  );

  return (
    <tr
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      className="group cursor-pointer"
      onClick={onSelect}
      onDoubleClick={onEdit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <td
        className={twMerge(cellClassName, 'border-l', isLast && 'rounded-bl-[6px]')}
        title={data.name || 'Без названия'}
      >
        {data.name || 'Без названия'}
      </td>
      <td className={twMerge(cellClassName, 'font-Fira-Mono')} title={data.address}>
        {data.address}
      </td>
      <td
        className={twMerge(cellClassName, isLast && 'rounded-br-[6px]')}
        title={data.type || 'Не указан'}
      >
        {data.type || 'Не указан'}
      </td>
      <td className="pl-3">
        <div
          className="flex w-[66px] items-center gap-3"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <WithHint hint="Изменить" placement="top">
            {(hintProps) => (
              <button
                {...hintProps}
                type="button"
                className="size-[14px] shrink-0 opacity-70 transition-opacity hover:opacity-100"
                aria-label="Изменить запись"
                onClick={onEdit}
              >
                <EditIcon className="size-[14px]" />
              </button>
            )}
          </WithHint>
          <WithHint hint="Метаданные" placement="top">
            {(hintProps) => (
              <button
                {...hintProps}
                type="button"
                className="size-[14px] shrink-0 opacity-70 transition-opacity hover:opacity-100"
                aria-label="Показать метаданные"
                onClick={onMetaData}
              >
                <LensIcon className="size-[14px]" />
              </button>
            )}
          </WithHint>
          <WithHint hint="Удалить" placement="top">
            {(hintProps) => (
              <span {...hintProps} className="size-[14px] shrink-0">
                <DeleteButton aria-label="Удалить запись" onClick={onRemove} />
              </span>
            )}
          </WithHint>
        </div>
      </td>
    </tr>
  );
};
