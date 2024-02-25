import { useLayoutEffect } from 'react';

import { useForm } from 'react-hook-form';

import { Modal, TextField } from '@renderer/components/UI';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (host: string, port: number) => void;
  onReset: () => void;

  defaultHostValue: string;
  defaultPortValue: string;
}

interface FormValues {
  host: string;
  port: string;
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  onClose,
  onSubmit,
  onReset,
  defaultHostValue,
  defaultPortValue,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit, setValue, register } = useForm<FormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    onSubmit(data.host, Number(data.port));
    onClose();
  });

  useLayoutEffect(() => {
    setValue('host', defaultHostValue);
    setValue('port', defaultPortValue);
  }, [setValue, defaultHostValue, defaultPortValue]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Выберите компилятор"
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className={'mb-2 flex gap-2'}>
        <TextField
          maxLength={80}
          {...register('host', { required: true })}
          label="Хост:"
          placeholder="Напишите адрес хоста"
        />
        <TextField
          {...register('port', { required: true })}
          label="Порт:"
          placeholder="Напишите порт"
          onInput={(event) => {
            const { target } = event;
            if (target) {
              (target as HTMLInputElement).value = (target as HTMLInputElement).value.replace(
                /[^0-9]/g,
                ''
              );
            }
          }}
        />
      </div>
      <button type="button" className="btn-secondary" onClick={onReset}>
        Сбросить настройки
      </button>
    </Modal>
  );
};
