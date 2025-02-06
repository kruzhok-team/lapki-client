import React, { useLayoutEffect } from 'react';

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

  const {
    register,
    control,
    handleSubmit: hookHandleSubmit,
    watch,
    setValue,
  } = useForm<AutosaveFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    setSettings(data);
    onClose();
  });

  useLayoutEffect(() => {
    if (!settings) return;

    setValue('interval', settings.interval);
    setValue('disabled', settings.disabled);
  }, [setValue, settings]);

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
      <div className="mb-2 flex items-center gap-1">
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
        <WithHint hint={'Вернуть интервал на значение по-умолчанию'}>
          {(props) => (
            <button
              className={twMerge(
                'text-icon-secondary',
                !settings.disabled && 'hover:text-icon-active'
              )}
              {...props}
              onClick={(e) => {
                e.preventDefault();
                resetSettings();
              }}
              disabled={settings.disabled}
            >
              ↺
            </button>
          )}
        </WithHint>
      </div>
      <div className=" mb-auto flex items-center gap-[22px]">
        Отключить:
        <Controller
          control={control}
          name="disabled"
          render={({ field: { value, onChange } }) => {
            return <Switch checked={value} onCheckedChange={onChange} />;
          }}
        />
      </div>
    </Modal>
  );
};
