import { useLayoutEffect, useMemo, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { useSettings } from '@renderer/hooks';
import { getUserOS, removeNonNumbers } from '@renderer/utils';

import { MovingModal, ParameterSelect, TextField } from '../../UI';

type FormValues = Main['settings']['compiler'];

interface CompilerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
];

export const CompilerSelectModal: React.FC<CompilerSelectModalProps> = ({ onClose, ...props }) => {
  const [compilerSetting, setCompilerSetting, , getDefaultSetting] = useSettings('compiler');

  const { control, handleSubmit: hookHandleSubmit, reset, register, watch } = useForm<FormValues>();
  const isSecondaryFieldsDisabled = watch('type') === 'local';
  const [warning, setWarning] = useState<string | null>(null);
  const currentServerLabel = `Текущий тип сервера: ${
    compilerSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;
  const userOS = useMemo(() => {
    return getUserOS();
  }, []);
  const handleSubmit = hookHandleSubmit(async (data) => {
    if (!compilerSetting) return;

    await setCompilerSetting({ ...compilerSetting, ...data });
    onClose();
  });

  const handleClose = () => {
    if (compilerSetting) reset(compilerSetting);

    onClose();
  };

  const handleReset = async () => {
    const defaultSetting = await getDefaultSetting();

    reset(defaultSetting);
  };

  useLayoutEffect(() => {
    if (!isSecondaryFieldsDisabled) {
      setWarning('');
      return;
    }
    if (userOS !== 'Windows') {
      setWarning('Пока что ваша платформа не поддерживает локальный компилятор :(');
    }
  }, [isSecondaryFieldsDisabled, setWarning, userOS]);

  useLayoutEffect(() => {
    if (!compilerSetting || compilerSetting.localPort === undefined) return;

    reset(compilerSetting);
  }, [reset, compilerSetting]);

  return (
    <MovingModal
      {...props}
      id="compiler-settings"
      onRequestClose={handleClose}
      title={'Укажите адрес компилятора'}
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
            };

            return (
              <label className="flex flex-col gap-3">
                <span className="h2-header">Тип</span>
                <ParameterSelect
                  containerClassName="w-36"
                  value={options.find((opt) => opt.value === value)}
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
            {...register(watch('type') === 'local' ? 'localHost' : 'remoteHost')}
            placeholder="Напишите адрес хоста"
            disabled={isSecondaryFieldsDisabled}
          />
          <TextField
            containerClassName="w-36 gap-3 h2-header"
            className="rounded-lg font-normal disabled:cursor-not-allowed disabled:bg-inactive-input disabled:text-text-inactive"
            label="Порт"
            {...register(watch('type') === 'local' ? 'localPort' : 'remotePort', {
              valueAsNumber: true,
            })}
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

        {warning && <div className="text-warning">{warning}</div>}
      </div>
    </MovingModal>
  );
};
