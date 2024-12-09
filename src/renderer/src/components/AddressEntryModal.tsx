import { UseFormReturn } from 'react-hook-form';

import { AddressData } from '@renderer/types/FlasherTypes';

import { Modal } from './UI';
import { TextInput } from './UI/TextInput';

interface AddressEntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDuplicate: (address: string) => boolean | null;
  onSubmit: (data: AddressData) => void;
  submitLabel: string;
  form: UseFormReturn<AddressData>;
}

/**
 * Модальное окно для добавления или редактирования записи в адресной книге МС-ТЮК
 */
export const AddressEntryEditModal: React.FC<AddressEntryEditModalProps> = (props) => {
  const { isOpen, isDuplicate, onClose, onSubmit, submitLabel, form } = props;
  const {
    handleSubmit: hookHandleSubmit,
    register,
    formState: { errors, dirtyFields },
    setError,
    clearErrors,
    getValues,
  } = form;
  const handleSubmit = hookHandleSubmit((submitData) => {
    const sendSubmit = () => {
      onSubmit(submitData);
      clearErrors();
      onClose();
    };
    if (submitData.address != '' && !dirtyFields.address) {
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
    if (isDuplicate(submitData.address)) {
      setError('address', { message: 'Адрес уже содержится в книге' });
      return;
    }
    sendSubmit();
  });
  const meta = getValues('meta');
  return (
    <Modal
      title="Адрес устройства"
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
    >
      <div className="flex items-start gap-1">
        <label className="flex w-full flex-col">
          <TextInput placeholder="Название" {...register('name')} />
        </label>

        <label className="flex w-full flex-col">
          <TextInput
            error={!!errors.address?.message}
            maxLength={16}
            placeholder="Адрес"
            className="w-full max-w-full"
            {...register('address')}
          />
          <p className="text-sm text-error">{errors.address?.message}</p>
        </label>

        <label className="flex w-full flex-col">
          <TextInput
            placeholder="Тип"
            className="w-full max-w-full"
            disabled={true}
            {...register('type')}
          />
        </label>
      </div>
      <br></br>
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
      {!meta && <p className="mb-1 text-xl opacity-60">Метаданных нет</p>}
    </Modal>
  );
};
