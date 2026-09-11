import React, { useLayoutEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { useSettings } from '@renderer/hooks';
import { removeNonNumbers } from '@renderer/utils';

import { MovingModal, Switch, TextInput, WithHint } from '../../UI';

export interface AutosaveFormValues {
  interval: number;
  disabled: boolean;
}

interface AutosaveProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Autosave: React.FC<AutosaveProps> = ({ isOpen, onClose, ...props }) => {
  const [settings, setSettings] = useSettings('autoSave');
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const {
    register,
    control,
    handleSubmit: hookHandleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AutosaveFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    if (!data.interval) {
      setError('interval', { message: 'Введите значение интервала!' });
      return;
    }

    if (data.interval <= 0) {
      setError('interval', { message: 'Значение интервала должно быть больше 0!' });
      return;
    }

    setSettings(data);
    onClose();
  });

  useLayoutEffect(() => {
    if (!settings) return;

    setValue('interval', settings.interval);
    setValue('disabled', settings.disabled);
  }, [setValue, settings]);

  const handleIntervalClick = () => {
    if (!watch('disabled')) return;

    setError('disabled', { message: 'Включите автосохранение, чтобы изменить интервал.' });

    if (timerId) clearTimeout(timerId);

    const timeout = setTimeout(() => {
      clearErrors('disabled');
    }, 5000);
    setTimerId(timeout);
  };

  if (settings === null) return null;

  return (
    <MovingModal
      {...props}
      id="autosave-settings"
      title="Настройки автосохранения"
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Сохранить"
      hideCancelButton
      className="w-[348px]"
    >
      <div className="flex flex-col gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span>Автосохранение</span>
          <Controller
            control={control}
            name="disabled"
            render={({ field: { value, onChange } }) => (
              <Switch
                checked={!value}
                onCheckedChange={(checked) => {
                  if (timerId) {
                    clearErrors('disabled');
                    clearTimeout(timerId);
                  }
                  onChange(!checked);
                }}
              />
            )}
          />
        </div>

        <div className="flex items-center">
          <span>Интервал</span>
          <div onClick={handleIntervalClick}>
            <TextInput
              {...register('interval', { valueAsNumber: true })}
              maxLength={4}
              className="ml-3 mr-2 w-[62px] rounded-lg"
              disabled={watch('disabled')}
              onInput={(event) => {
                const { target } = event;
                if (target) {
                  (target as HTMLInputElement).value = removeNonNumbers(
                    (target as HTMLInputElement).value
                  );
                }
              }}
            />
          </div>
          <WithHint hint="Количество секунд после последнего сохранения, через которое произойдёт автосохранение.">
            {(hintProps) => (
              <div className="shrink-0" {...hintProps}>
                <QuestionMark />
              </div>
            )}
          </WithHint>
        </div>

        {errors.interval && <p className="text-xs text-error">{errors.interval.message}</p>}
        {errors.disabled && <p className="text-xs text-warning">{errors.disabled.message}</p>}
      </div>
    </MovingModal>
  );
};
