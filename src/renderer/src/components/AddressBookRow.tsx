import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { AddressData } from '@renderer/types/FlasherTypes';

import { TextInput } from './UI/TextInput';

interface AddressBookRowProps {
  data: AddressData;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}
export const AddressBookRow: React.FC<AddressBookRowProps> = (props) => {
  const { data, onSelect, isSelected, onEdit } = props;
  return (
    <div
      className={twMerge('flex items-start gap-1', isSelected && 'bg-bg-active')}
      draggable
      onClick={onSelect}
      onDoubleClick={onEdit}
    >
      <label className="flex flex-col">
        <TextInput value={data.name} disabled={true} placeholder="Название" />
      </label>

      <label className="flex w-full flex-col">
        <TextInput value={data.address} disabled={true} className="w-full max-w-full" />
      </label>

      <label className="flex flex-col">
        <TextInput
          value={data.type}
          placeholder="Тип"
          className="w-full max-w-full"
          disabled={true}
        />
      </label>
    </div>
  );
};
