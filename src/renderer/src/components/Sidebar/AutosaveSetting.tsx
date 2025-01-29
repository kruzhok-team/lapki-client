import React, { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { useSettings } from '@renderer/hooks';
import { removeNonNumbers } from '@renderer/utils';

import { Switch, TextInput, WithHint } from '../UI';
export const Autosave: React.FC = () => {
  const [settings, setSettings, resetSettings] = useSettings('autoSave');
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [interval, setInterval] = useState<number>(0);
  useEffect(() => {
    if (settings === null) return;
    if (timerId) {
      clearTimeout(timerId);
    }
    if (interval !== settings.interval && interval > 0) {
      const newTimerId = setTimeout(() => {
        setSettings({ ...settings, interval: interval });
        toast.info(`Интервал автосохранения изменён на ${interval} сек.`);
      }, 1500);
      setTimerId(newTimerId);
    }
  }, [interval, setSettings, settings, timerId]);
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
          defaultValue={settings.interval}
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
