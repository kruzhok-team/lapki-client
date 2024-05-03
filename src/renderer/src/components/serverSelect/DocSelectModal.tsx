import { useLayoutEffect } from 'react';

import { useForm } from 'react-hook-form';

import { Modal, TextField } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';

type FormValues = Main['settings']['doc'];

interface DocSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocSelectModal: React.FC<DocSelectModalProps> = ({ onClose, ...props }) => {
  const [docSetting, setDocSetting, resetDocSetting] = useSettings('doc');

  const { register, handleSubmit: hookHandleSubmit, reset } = useForm<FormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    setDocSetting(data);
    onClose();
  });

  const handleAfterClose = () => {
    if (!docSetting) return;

    reset(docSetting);
  };

  useLayoutEffect(() => {
    if (!docSetting) return;

    reset(docSetting);
  }, [reset, docSetting]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Укажите сервер документации"
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      onAfterClose={handleAfterClose}
    >
      <TextField
        className="mb-2"
        maxLength={80}
        {...register('host', { required: true })}
        label="Адрес:"
        placeholder="Напишите адрес"
      />

      <button type="button" className="btn-secondary" onClick={resetDocSetting}>
        Сбросить настройки
      </button>
    </Modal>
  );
  // TODO: использовать символ ↺ (или что похожее) для кнопки сброса
  // <button className="w-0">↺</button>
  // <button className="h-0 w-0">↺</button>;
};
