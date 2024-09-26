import React, { useState } from 'react';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { AddressData } from '@renderer/types/FlasherTypes';

import { TextInput } from './UI/TextInput';

interface AddressBookRowProps {
  data: AddressData;
  onSelect: (address: string | undefined) => void; // если undefined, то значит адрес не является валидным
  onRemove: () => void;
}
export const AddressBookRow: React.FC<AddressBookRowProps> = (props) => {
  const { data, onSelect: onSelect, onRemove } = props;
  const [addressError, setAddressError] = useState<string | undefined>(undefined);
  const verifyAddress = (): boolean => {
    if (data.address.length != 16) {
      setAddressError('Длина адреса должна быть равна 16');
      return false;
    }
    const re: RegExp = /[0-9A-Fa-f]{6}/g;
    if (!re.test(data.address)) {
      setAddressError('Адрес не является корректным шестнадцатеричным числом');
      return false;
    }
    setAddressError(undefined);
    return true;
  };
  const onSelectHandle = () => {
    if (verifyAddress()) {
      onSelect(data.address);
    }
    onSelect(undefined);
  };
  return (
    <div className="flex items-start gap-1">
      <button
        type="button"
        className="rounded p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
        onClick={onRemove}
      >
        <CloseIcon className="h-3 w-3" />
      </button>
      <label className="flex flex-col">
        <TextInput
          defaultValue={data.name}
          placeholder="Название"
          onChange={(event) => {
            data.name = event.target.value;
          }}
        />
      </label>

      <label className="flex w-full flex-col">
        <TextInput
          defaultValue={data.address}
          error={addressError != undefined}
          onChange={(event) => {
            data.address = event.target.value;
          }}
          maxLength={16}
          placeholder="Адрес"
          className="w-full max-w-full"
        />
        <p className="text-sm text-error">{addressError}</p>
      </label>

      <label className="flex flex-col">
        <TextInput
          defaultValue={data.type}
          placeholder="Тип"
          className="w-full max-w-full"
          disabled={true}
        />
      </label>

      <button
        type="button"
        className="rounded p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
        onClick={onSelectHandle}
      >
        <ArrowIcon className="h-3 w-3" />
      </button>
    </div>
  );
};
