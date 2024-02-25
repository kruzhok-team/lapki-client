import { useLayoutEffect } from 'react';

import { useForm } from 'react-hook-form';

import { Modal, TextField } from '@renderer/components/UI';

interface DocSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (host: string) => void;
  onReset: () => void;

  defaultHostValue: string;
}

interface FormValues {
  host: string;
}

export const DocSelectModal: React.FC<DocSelectModalProps> = ({
  onClose,
  onSubmit,
  onReset,
  defaultHostValue,
  ...props
}) => {
  const { register, handleSubmit: hookHandleSubmit, setValue } = useForm<FormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    onSubmit(data.host);
    onClose();
  });

  useLayoutEffect(() => {
    setValue('host', defaultHostValue);
  }, [setValue, defaultHostValue]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Выберите док-сервер"
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <TextField
        className="mb-2"
        maxLength={80}
        {...register('host', { required: true })}
        label="Адрес:"
        placeholder="Напишите адрес"
      />

      <button type="button" className="btn-secondary" onClick={onReset}>
        Сбросить настройки
      </button>
    </Modal>
  );
  // TODO: использовать символ ↺ (или что похожее) для кнопки сброса
  // <button className="w-0">↺</button>
  // <button className="h-0 w-0">↺</button>;
};
