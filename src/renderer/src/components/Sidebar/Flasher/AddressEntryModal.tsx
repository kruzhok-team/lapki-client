import { Controller, UseFormReturn } from 'react-hook-form';

import { ComponentFormFieldLabel } from '@renderer/components/ComponentFormFieldLabel';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
import { AddressData } from '@renderer/types/FlasherTypes';

import { Modal, Select, SelectOption } from '../../UI';

export type AddressEntryForm = {
  name: string;
  address: string;
  addressEditBlock: boolean;
  type: string;
  typeEditBlock: boolean;
};

interface AddressEntryEditModalProps {
  addressBookSetting: AddressData[] | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressEntryForm) => void;
  submitLabel: string;
  form: UseFormReturn<AddressEntryForm>;
}

/**
 * Модальное окно для добавления или редактирования записи в адресной книге МС-ТЮК
 */
export const AddressEntryEditModal: React.FC<AddressEntryEditModalProps> = (props) => {
  const { addressBookSetting, isOpen, onClose, onSubmit, submitLabel, form } = props;
  const {
    handleSubmit: hookHandleSubmit,
    formState: { errors, dirtyFields },
    setError,
    clearErrors,
    getValues,
    control,
  } = form;
  const handleSubmit = hookHandleSubmit((submitData) => {
    if (addressBookSetting === null) return;
    const sendSubmit = () => {
      onSubmit(submitData);
      clearErrors();
      onClose();
    };
    if (submitData.address != '' && !dirtyFields.address && !dirtyFields.name) {
      sendSubmit();
      return;
    }
    if (submitData.address == '') {
      setError('address', { message: 'Необходимо указать адрес' });
      return;
    }
    if (submitData.address.length != 16) {
      setError('address', { message: 'Длина адреса должна быть равна 16' });
      return;
    }
    const re: RegExp = /[0-9A-Fa-f]{16}/g;
    if (!re.test(submitData.address)) {
      setError('address', { message: 'Адрес не является корректным шестнадцатеричным числом' });
      return;
    }
    if (
      dirtyFields.address &&
      addressBookSetting.find((v) => {
        return v.address === submitData.address;
      }) !== undefined
    ) {
      setError('address', { message: 'Адрес уже содержится в книге' });
      return;
    }
    if (
      submitData.name &&
      dirtyFields.name &&
      addressBookSetting.find((v) => {
        return v.name === submitData.name;
      }) !== undefined
    ) {
      setError('name', { message: 'Имя уже содержится в книге' });
      return;
    }
    sendSubmit();
  });
  const addressEditBlock = getValues('addressEditBlock');
  const typeEditBlock = getValues('typeEditBlock');
  return (
    <Modal
      title="Адрес устройства"
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
    >
      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => {
            return (
              <ComponentFormFieldLabel
                label="Название:"
                placeholder="Введите название..."
                hint="Человекочитаемое название, которое будет отображаться в интерфейсе вместо адреса."
                value={value}
                error={errors.name?.message}
                onChange={onChange}
              />
            );
          }}
        />
        <Controller
          control={control}
          name="address"
          render={({ field: { value, onChange } }) => {
            return (
              <ComponentFormFieldLabel
                label="Адрес:"
                placeholder="Введите адрес..."
                hint="Адрес платы МС-ТЮК. Это значение нельзя изменить после сохранения!"
                value={value}
                error={errors.address?.message}
                onChange={onChange}
                disabled={addressEditBlock}
                maxLength={16}
                className={addressEditBlock ? 'disabled:opacity-70' : ''}
              />
            );
          }}
        />
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const label = 'Тип:';
            const noneOption = 'Отсутствует';
            const hint = `Тип платы. Это значение нельзя изменить после сохранения (если не выбран вариант «${noneOption}»)!`;
            if (typeEditBlock) {
              return (
                <ComponentFormFieldLabel
                  label={label}
                  hint={hint}
                  value={value}
                  disabled={true}
                  // Альтернативы:
                  // border-b border-l-0 border-r-0 border-t-0 pb-1
                  // border-none
                  className="disabled:opacity-70"
                />
              );
            } else {
              const typeOptions: SelectOption[] = [
                {
                  label: noneOption,
                  value: '',
                  hint: 'Выберите этот вариант, если подходящей платы нет в списке. Этот выбор можно будет изменить после сохранения.',
                },
              ];
              typeOptions.push(
                ...getAvailablePlatforms()
                  .filter((v) => v.idx.startsWith('tjc'))
                  .map((v) => {
                    return { label: v.idx, value: v.idx, hint: v.name } as SelectOption;
                  })
              );
              return (
                <ComponentFormFieldLabel label={label} hint={hint} as="div">
                  <Select
                    placeholder={'Выберите тип платы'}
                    onChange={(v) => onChange(v?.value ?? '')}
                    options={typeOptions}
                    value={typeOptions.find((opt) => opt.value === value)}
                    isSearchable={false}
                  />
                </ComponentFormFieldLabel>
              );
            }
          }}
        />
      </div>
    </Modal>
  );
};
