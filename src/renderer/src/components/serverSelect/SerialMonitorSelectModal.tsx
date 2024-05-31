import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Select, Modal, TextField } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
];

interface SerialMonitorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SerialMonitorSelectModalFormValues) => void;
}

export interface SerialMonitorSelectModalFormValues {
  host: string;
  port: number;
  type: 'local' | 'remote';
}

export const SerialMonitorSelectModal: React.FC<SerialMonitorSelectModalProps> = ({
  onClose,
  onSubmit,
  ...props
}) => {
  const [SerialMonitorSetting] = useSettings('flasher');

  const {
    register,
    control,
    handleSubmit: hookHandleSubmit,
    watch,
    setValue,
  } = useForm<SerialMonitorSelectModalFormValues>();

  const isSecondaryFieldsDisabled = watch('type') === 'local';

  const handleSubmit = hookHandleSubmit((data) => {
    onSubmit(data);
    onClose();
  });

  const currentServerLabel = `Текущий тип сервера: ${
    SerialMonitorSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

  useLayoutEffect(() => {
    if (!SerialMonitorSetting) return;

    setValue('type', SerialMonitorSetting.type);
    setValue('host', SerialMonitorSetting.host ?? '');
    setValue('port', Number(SerialMonitorSetting.port ?? ''));
  }, [setValue, SerialMonitorSetting]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title={'Укажите адрес Serial monitor'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center">
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const handleChange = (v: any) => {
              onChange(v.value);

              if (v.value !== 'local' || !SerialMonitorSetting) return;

              setValue('port', SerialMonitorSetting.localPort);
              setValue('host', 'localhost');
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
      <div className="mb-2 flex gap-2">
        <TextField
          maxLength={80}
          className="disabled:opacity-50"
          label="Хост:"
          {...register('host')}
          placeholder="Напишите адрес хоста"
          disabled={isSecondaryFieldsDisabled}
        />
        <TextField
          className="disabled:opacity-50"
          label="Порт:"
          {...register('port', { valueAsNumber: true })}
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
          disabled={isSecondaryFieldsDisabled}
        />
      </div>

      <div>{currentServerLabel}</div>
    </Modal>
  );
};
