import { useCallback, useEffect, useState } from 'react';

type Settings = Main['settings'];
type SettingsKey = keyof Settings;

export const useSettings = <T extends SettingsKey>(key: T) => {
  const [value, setValue] = useState<Settings[T] | null>(null);

  const setSetting = useCallback(
    (value: Settings[T]) => {
      return window.electron.ipcRenderer.invoke('settings:set', key, value);
    },
    [key]
  );

  const resetSetting = useCallback(() => {
    return window.electron.ipcRenderer.invoke('settings:reset', key);
  }, [key]);

  useEffect(() => {
    window.electron.ipcRenderer.invoke('settings:get', key).then(setValue);

    const unsubscribe = window.electron.ipcRenderer.on(`settings:change:${key}`, (_event, value) =>
      setValue(value)
    );

    return () => {
      unsubscribe();
    };
  }, [key]);

  return [value, setSetting, resetSetting] as const;
};
