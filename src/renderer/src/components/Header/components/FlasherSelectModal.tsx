import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { useSettings } from '@renderer/hooks';
import { removeNonNumbers } from '@renderer/utils';

import { MovingModal, ParameterSelect, TextField } from '../../UI';

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
] as const;

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
  const [flasherSetting, , , getDefaultSetting] = useSettings('flasher');
  const {
    control,
    handleSubmit: hookHandleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<FlasherSelectModalFormValues>();
  const isSecondaryFieldsDisabled = watch('type') === 'local';
  const currentServerLabel = `Текущий тип сервера: ${
    flasherSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

  const handleSubmit = hookHandleSubmit((data) => {
    onSubmit(data);
    onClose();
  });

  const handleClose = () => {
    if (flasherSetting) reset(flasherSetting);

    onClose();
  };

  const handleReset = async () => {
    const defaultSetting = await getDefaultSetting();

    reset(defaultSetting);
  };

  useLayoutEffect(() => {
    if (!flasherSetting) return;

    reset(flasherSetting);
  }, [flasherSetting, reset]);

  return (
    <MovingModal
      {...props}
      id="flasher-settings"
      onRequestClose={handleClose}
      title="Укажите адрес загрузчика"
      submitLabel="Сохранить"
      onSubmit={handleSubmit}
      sideLabel="Сбросить"
      onSide={handleReset}
      hideCancelButton
      className="w-[348px]"
    >
      <div className="flex flex-col">
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const handleChange = (option: (typeof options)[number] | null) => {
              if (!option) return;

              onChange(option.value);

              if (option.value !== 'local' || !flasherSetting) return;

              setValue('host', 'localhost');
              setValue('port', flasherSetting.localPort);
            };

            return (
              <label className="flex flex-col gap-3">
                <span className="h2-header">Тип</span>
                <ParameterSelect
                  containerClassName="w-36"
                  value={options.find((option) => option.value === value)}
                  onChange={handleChange}
                  options={options}
                  isSearchable={false}
                />
              </label>
            );
          }}
        />

        <div className="mb-3 mt-2 text-text-inactive">{currentServerLabel}</div>

        <div className="flex gap-3">
          <TextField
            maxLength={80}
            containerClassName="w-36 gap-3 h2-header"
            className="rounded-lg font-normal disabled:cursor-not-allowed disabled:bg-inactive-input disabled:text-text-inactive"
            label="Хост"
            {...register('host')}
            placeholder="Напишите адрес хоста"
            disabled={isSecondaryFieldsDisabled}
          />
          <TextField
            containerClassName="w-36 gap-3 h2-header"
            className="rounded-lg font-normal disabled:cursor-not-allowed disabled:bg-inactive-input disabled:text-text-inactive"
            label="Порт"
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
      </div>
    </MovingModal>
  );
};
