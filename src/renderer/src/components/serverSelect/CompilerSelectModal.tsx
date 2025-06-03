import { useLayoutEffect, useMemo, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Modal, Select, TextField } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { getUserOS, removeNonNumbers } from '@renderer/utils';

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
  const [compilerSetting, setCompilerSetting, resetSetting] = useSettings('compiler');

  const {
    control,
    handleSubmit: hookHandleSubmit,
    reset,
    register,
    watch,
    setValue,
  } = useForm<FormValues>();
  const isSecondaryFieldsDisabled = watch('type') === 'local';
  const [warning, setWarning] = useState<string | null>(null);
  const currentServerLabel = `Текущий тип сервера: ${
    compilerSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;
  const userOS = useMemo(() => {
    return getUserOS();
  }, []);
  const handleSubmit = hookHandleSubmit((data) => {
    setCompilerSetting({ ...compilerSetting, ...data });
    onClose();
  });

  const handleAfterClose = () => {
    if (!compilerSetting) return;

    reset(compilerSetting);
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

    setValue('type', compilerSetting.type);
    if (compilerSetting.type === 'remote') {
      setValue('remoteHost', compilerSetting.remoteHost ?? '');
      setValue('remotePort', Number(compilerSetting.remotePort));
    } else {
      setValue('localHost', compilerSetting.localHost);
      setValue('localPort', compilerSetting.localPort);
    }
  }, [setValue, compilerSetting]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title={'Укажите адрес компилятора'}
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

              if (!compilerSetting) return;
              if (v.value === 'local') {
                setValue('localPort', compilerSetting.localPort);
                setValue('localHost', 'localhost');
              } else {
                setValue('remotePort', compilerSetting.remotePort);
                setValue('remoteHost', compilerSetting.remoteHost);
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
      <div className="mb-2 flex gap-2">
        <TextField
          maxLength={80}
          className="disabled:opacity-50"
          label="Хост:"
          {...register(watch('type') === 'local' ? 'localHost' : 'remoteHost')}
          placeholder="Напишите адрес хоста"
          disabled={isSecondaryFieldsDisabled}
        />
        <TextField
          className="disabled:opacity-50"
          label="Порт:"
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
      <div>{currentServerLabel}</div>
      <button type="button" className="btn-secondary mt-4" onClick={resetSetting}>
        Сбросить настройки
      </button>
      {warning && <div className="mt-2 text-warning">{warning}</div>}
    </Modal>
  );
};
