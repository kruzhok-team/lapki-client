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
                hint="Адрес платы МС-ТЮК. Это значение нельзя изменить!"
                value={value}
                error={errors.address?.message}
                onChange={onChange}
                disabled={getValues('addressEditBlock')}
                maxLength={16}
              />
            );
          }}
        />
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const label = 'Тип:';
            const hint = 'Тип платы. Это значение нельзя изменить!';
            if (getValues('typeEditBlock')) {
              return (
                <ComponentFormFieldLabel label={label} hint={hint} value={value} disabled={true} />
              );
            } else {
              const typeOptions: SelectOption[] = getAvailablePlatforms()
                .filter((v) => v.idx.startsWith('tjc'))
                .map((v) => {
                  return { label: v.idx, value: v.idx, hint: v.name } as SelectOption;
                });
              return (
                <ComponentFormFieldLabel label={label} hint={hint} as="div">
                  <Select
                    placeholder={'Выберите тип платы'}
                    onChange={(v) => onChange(v?.value ?? '')}
                    options={typeOptions}
                    value={typeOptions.find((opt) => opt.value === value)}
                  />
                </ComponentFormFieldLabel>
              );
            }
          }}
        />
      </div>
      {/* <br></br>
      {meta && (
        <div className="mb-2 flex flex-col gap-1">
          <h3 className="mb-1 text-xl">Метаданные</h3>
          <div>
            <b>{'bootloader REF_HW'}:</b> {meta.RefBlHw}
          </div>
          <div>
            <b>{'bootloader REF_FW'}:</b> {meta.RefBlFw}
          </div>
          <div>
            <b>{'bootloader REF_CHIP'}:</b> {meta.RefBlChip}
          </div>
          <div>
            <b>{'bootloader REF_PROTOCOL'}:</b> {meta.RefBlProtocol}
          </div>
          <div>
            <b>{'bootloader USER_CODE'}:</b> {meta.RefBlUserCode}
          </div>
          <div>
            <b>{'cybergene REF_FW'}:</b> {meta.RefCgFw}
          </div>
          <div>
            <b>{'cybergene REF_HW'}:</b> {meta.RefCgHw}
          </div>
          <div>
            <b>{'cybergene REF_PROTOCOL'}:</b> {meta.RefCgProtocol}
          </div>
        </div>
      )}
      {!meta && <p className="mb-1 text-xl opacity-60">Метаданных нет</p>} */}
    </Modal>
  );
};
