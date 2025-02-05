import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Select, Modal, TextField } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { removeNonNumbers } from '@renderer/utils';

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
];

interface FlasherSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FlasherSelectModalFormValues) => void;
}

export interface FlasherSelectModalFormValues {
  host: string;
  port: number;
  type: 'local' | 'remote';
}

export const FlasherSelectModal: React.FC<FlasherSelectModalProps> = ({
  onClose,
  onSubmit,
  ...props
}) => {
  const [flasherSetting] = useSettings('flasher');

  const {
    register,
    control,
    handleSubmit: hookHandleSubmit,
    watch,
    setValue,
  } = useForm<FlasherSelectModalFormValues>();

  const isSecondaryFieldsDisabled = watch('type') === 'local';

  const handleSubmit = hookHandleSubmit((data) => {
    onSubmit(data);
    onClose();
  });

  const currentServerLabel = `Текущий тип сервера: ${
    flasherSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

  useLayoutEffect(() => {
    if (!flasherSetting) return;

    setValue('type', flasherSetting.type);
    setValue('host', flasherSetting.host ?? '');
    setValue('port', Number(flasherSetting.port ?? ''));
  }, [setValue, flasherSetting]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title={'Укажите адрес загрузчика'}
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

              if (v.value !== 'local' || !flasherSetting) return;

              setValue('port', flasherSetting.localPort);
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
              (target as HTMLInputElement).value = removeNonNumbers(
                (target as HTMLInputElement).value
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
