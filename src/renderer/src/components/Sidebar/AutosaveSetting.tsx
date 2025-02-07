import React, { useLayoutEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { useSettings } from '@renderer/hooks';
import { removeNonNumbers } from '@renderer/utils';

import { Modal, Switch, TextInput, WithHint } from '../UI';

export interface AutosaveFormValues {
  interval: number;
  disabled: boolean;
}

interface AutosaveProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Autosave: React.FC<AutosaveProps> = ({ isOpen, onClose, ...props }) => {
  const [settings, setSettings, resetSettings] = useSettings('autoSave');

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
    if (timerId) {
      clearTimeout(timerId);
    }
    const timeout = setTimeout(() => {
      clearErrors('disabled');
    }, 5000);
    setTimerId(timeout);
  };

  if (settings === null) {
    return;
  }
  return (
    <Modal
      {...props}
      title={'Настройки автосохранения'}
      isOpen={isOpen}
      onRequestClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-1">
        <span>Интервал:</span>
        <WithHint
          hint={
            'Количество секунд после последнего сохранения через которое произойдёт автосохранение.'
          }
        >
          {(props) => (
            <div className="shrink-0" {...props}>
              <QuestionMark />
            </div>
          )}
        </WithHint>
        <div onClick={handleIntervalClick}>
          <TextInput
            {...register('interval', { valueAsNumber: true })}
            maxLength={4}
            className="max-w-[55px] disabled:opacity-50"
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
        <WithHint hint={'Вернуть интервал на значение по-умолчанию'}>
          {(props) => {
            const isDisabled = watch('disabled');
            return (
              <button
                className={twMerge(
                  'text-icon-secondary disabled:text-text-disabled',
                  !isDisabled && 'hover:text-icon-active'
                )}
                {...props}
                onClick={(e) => {
                  e.preventDefault();
                  resetSettings();
                }}
                disabled={isDisabled}
              >
                ↺
              </button>
            );
          }}
        </WithHint>
      </div>
      <div className="mb-4">
        {errors.interval && <p className="text-error">{errors.interval.message}</p>}
      </div>
      <div className=" mb-auto flex items-center gap-[22px]">
        Отключить:
        <Controller
          control={control}
          name="disabled"
          render={({ field: { value, onChange } }) => {
            return (
              <Switch
                checked={value}
                onCheckedChange={(e) => {
                  if (timerId) {
                    clearErrors('disabled');
                    clearTimeout(timerId);
                  }
                  onChange(e);
                }}
              />
            );
          }}
        />
      </div>
      {errors.disabled && <p className="text-warning">{errors.disabled.message}</p>}
    </Modal>
  );
};
