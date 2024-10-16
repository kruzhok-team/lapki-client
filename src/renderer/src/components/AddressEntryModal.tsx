import { UseFormReturn } from 'react-hook-form';

import { AddressData } from '@renderer/types/FlasherTypes';

import { Modal } from './UI';
import { TextInput } from './UI/TextInput';

interface AddressEntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDuplicate: (address: string) => boolean | undefined;
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
    </Modal>
  );
};
