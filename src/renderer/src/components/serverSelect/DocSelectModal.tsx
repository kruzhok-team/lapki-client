import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Modal, Select, TextField } from '@renderer/components/UI';
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
  const [docSetting, setDocSetting, resetDocSetting] = useSettings('doc');

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

  const isSecondaryFieldsDisabled = watch('type') === 'local';

  const currentServerLabel = `Текущий тип сервера: ${
    docSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

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
                // FIXME: брать из константы или настроек
                setValue('host', 'http://localhost:8071/');
              } else {
                setValue('host', docSetting?.remoteHost ?? docSetting?.host ?? '');
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

      <TextField
        className="mb-2 disabled:opacity-50"
        maxLength={80}
        {...register('host', { required: true })}
        label="Адрес:"
        placeholder="Напишите адрес"
        disabled={isSecondaryFieldsDisabled}
      />

      <button type="button" className="btn-secondary" onClick={resetDocSetting}>
        Сбросить настройки
      </button>

      <div>{currentServerLabel}</div>
    </Modal>
  );
};
