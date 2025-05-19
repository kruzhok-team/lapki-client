import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal, Select, TextField, WithHint } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';

type FormValues = Main['settings']['doc'];

interface DocSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
];

export const DocSelectModal: React.FC<DocSelectModalProps> = ({ onClose, ...props }) => {
  const [docSetting, setDocSetting] = useSettings('doc');

  const {
    register,
    handleSubmit: hookHandleSubmit,
    reset,
    control,
    setValue,
    watch,
  } = useForm<FormValues>();

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

  const isLocal = watch('type') === 'local';

  const currentServerLabel = `Текущий тип сервера: ${
    docSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

  const resetLocalHost = () => {
    window.electron.ipcRenderer.invoke('getLocalDocServer').then((addr) => {
      setValue('localHost', addr);
    });
  };

  const resetRemoteHost = () => {
    window.electron.ipcRenderer.invoke('getRemoteDocServer').then((addr) => {
      setValue('remoteHost', addr);
    });
  };

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Укажите адрес документации"
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      onAfterClose={handleAfterClose}
    >
      <div className="flex items-center">
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const handleChange = (v: any) => {
              onChange(v.value);

              if (v.value === 'local') {
                resetLocalHost();
              } else if (!docSetting?.remoteHost) {
                resetRemoteHost();
              }
            };

            return (
              <div>
                Тип
                <Select
                  value={options.find((opt) => opt.value === value)}
                  onChange={handleChange}
                  options={options}
                  isSearchable={false}
                />
              </div>
            );
          }}
        />
      </div>

      <div className="flex items-center gap-1">
        <TextField
          className="mb-2 w-[600px] max-w-full disabled:opacity-50"
          maxLength={80}
          {...register(isLocal ? 'localHost' : 'remoteHost', { required: true })}
          label="Адрес"
          placeholder="Напишите адрес"
          disabled={isLocal}
        />

        <WithHint hint={'Вернуть значение адреса удалённой документации по-умолчанию'}>
          {(props) => {
            return (
              <button
                type="button"
                className={twMerge(
                  'text-icon-secondary disabled:text-text-disabled',
                  !isLocal && 'hover:text-icon-active'
                )}
                {...props}
                onClick={(e) => {
                  e.preventDefault();
                  resetRemoteHost();
                }}
                disabled={isLocal}
              >
                ↺
              </button>
            );
          }}
        </WithHint>
      </div>

      <div>{currentServerLabel}</div>
    </Modal>
  );
};
