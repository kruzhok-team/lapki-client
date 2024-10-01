import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { AddressData } from '@renderer/types/FlasherTypes';

import { TextInput } from './UI/TextInput';

interface AddressEntryEditModalProps {
  data: AddressData;
  onSubmit: (data: AddressData) => void;
}

/**
 * Модальное окно для добавления или редактирования записи в адресной книге МС-ТЮК
 */
export const AddressEntryEditModal: React.FC<AddressEntryEditModalProps> = (props) => {
  const { data } = props;
  const {
    register,
    formState: { errors },
  } = useForm<AddressData>({
    defaultValues: data,
  });
  const [addressError, setAddressError] = useState<string | undefined>(undefined);
  return (
    <div className="flex items-start gap-1">
      <label className="flex flex-col">
        <TextInput placeholder="Название" {...register('name')} />
      </label>

      <label className="flex w-full flex-col">
        <TextInput
          error={addressError != undefined}
          maxLength={16}
          placeholder="Адрес"
          className="w-full max-w-full"
          {...register('address', { required: 'Необходимо указать адрес' })}
        />
        <p className="text-sm text-error">{addressError}</p>
      </label>

      <label className="flex flex-col">
        <TextInput
          placeholder="Тип"
          className="w-full max-w-full"
          disabled={true}
          {...register('type')}
        />
      </label>
    </div>
  );
};
