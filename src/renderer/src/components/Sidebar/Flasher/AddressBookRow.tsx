import { twMerge } from 'tailwind-merge';

import { AddressData } from '@renderer/types/FlasherTypes';

import { TextInput } from '../../UI/TextInput';

interface AddressBookRowProps {
  data: AddressData;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}
export const AddressBookRow: React.FC<AddressBookRowProps> = (props) => {
  const { data, onSelect, isSelected, onEdit, onDragStart, onDrop } = props;
  const labelClassName = twMerge('flex w-full', isSelected && 'bg-bg-active');
  return (
    <div
      className="flex items-start"
      draggable
      onClick={onSelect}
      onDoubleClick={onEdit}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
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
