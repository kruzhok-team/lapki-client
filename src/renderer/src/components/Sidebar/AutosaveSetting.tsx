import React, { useEffect, useState } from 'react';

import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { useSettings } from '@renderer/hooks';
import { removeNonNumbers } from '@renderer/utils';

import { Switch, TextInput, WithHint } from '../UI';
export const Autosave: React.FC = () => {
  const [settings, setSettings, resetSettings] = useSettings('autoSave');
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [interval, setInterval] = useState<number | null>(null);
  useEffect(() => {
    if (settings === null) return;
    if (interval === null) {
      setInterval(settings.interval);
      return;
    }
    const settingInterval = () => {
      setSettings({ ...settings, interval: interval });
    };
    // TODO (Roundabout): не работает при закрытии приложении, но работает при перезагрузке
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      settingInterval();
    };
    if (timerId) {
      clearTimeout(timerId);
      window.removeEventListener('beforeunload', onBeforeUnload, { capture: true });
      // сразу же применяем настройки без таймера
      if (settings.disabled && interval !== settings.interval && interval > 0) {
        settingInterval();
        return;
      }
    }
    if (interval !== settings.interval && interval > 0) {
      window.addEventListener('beforeunload', onBeforeUnload, { capture: true });
      const newTimerId = setTimeout(() => {
        settingInterval();
        toast.info(`Интервал автосохранения изменён на ${interval} сек.`);
        window.removeEventListener('beforeunload', onBeforeUnload, { capture: true });
      }, 1500);
      setTimerId(newTimerId);
    }
  }, [interval, settings]);
  if (settings === null) {
    return;
  }
  return (
    <div>
      <span>Автосохранение</span>
      <div className="mb-2 flex items-center gap-1 pl-2">
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
          maxLength={4}
          className="max-w-[55px] disabled:opacity-50"
          value={interval ?? settings.interval}
          disabled={settings.disabled}
          onInput={(event) => {
            const { target } = event;
            if (target) {
              const filteredInput = removeNonNumbers((target as HTMLInputElement).value);
              (target as HTMLInputElement).value = filteredInput;
              setInterval(Number(filteredInput));
            }
          }}
        ></TextInput>
        <WithHint hint={'Вернуть интервал на значение по-умолчанию'}>
          {(props) => (
            <button
              className={twMerge(
                'text-icon-secondary',
                !settings.disabled && 'hover:text-icon-active'
              )}
              {...props}
              onClick={() => {
                resetSettings().then(() => {
                  setInterval(null);
                  toast.info(`Интервал автосохранения возвращён на значение по-умолчанию`);
                });
              }}
              disabled={settings.disabled}
            >
              ↺
            </button>
          )}
        </WithHint>
      </div>
      <div className=" mb-auto flex items-center gap-1 pl-2">
        Отключить:
        <Switch
          checked={settings.disabled}
          onCheckedChange={() => {
            setSettings({ ...settings, disabled: !settings.disabled });
          }}
        />
      </div>
    </div>
  );
};
