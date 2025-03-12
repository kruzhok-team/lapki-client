import { Checkbox } from '@radix-ui/react-checkbox';
import { twMerge } from 'tailwind-merge';

import { AddressData } from '@renderer/types/FlasherTypes';

import { TextInput } from '../../UI/TextInput';

const cellHeight = 'h-[38px]';

interface AddressBookRowProps {
  data: AddressData;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onCheckChange: () => void;
}
export const AddressBookRow: React.FC<AddressBookRowProps> = (props) => {
  const { data, onSelect, isSelected, onEdit, onDragStart, onDrop, isChecked, onCheckChange } =
    props;
  const labelClassName = twMerge('flex w-full', isSelected && 'bg-bg-active', cellHeight);
  return (
    <div
      className="flex items-start"
      draggable
      onClick={onSelect}
      onDoubleClick={onEdit}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      {/* <TextInput className="w-1" value={'f'} disabled={true} placeholder="f" /> */}
      <Checkbox
        checked={isChecked}
        onCheckedChange={onCheckChange}
        className={twMerge('w-[76px] rounded border border-border-primary', cellHeight)}
      />
      <label className={labelClassName}>
        <TextInput value={data.name ?? ''} disabled={true} placeholder="Название" />
      </label>

      <label className={labelClassName}>
        <TextInput value={data.address} disabled={true} />
      </label>

      <label className={labelClassName}>
        <TextInput
          value={data.type ?? ''}
          placeholder="Тип"
          className="w-full max-w-full"
          disabled={true}
        />
      </label>
    </div>
  );
};
