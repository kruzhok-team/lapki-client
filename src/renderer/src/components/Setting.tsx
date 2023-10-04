import React from 'react';

import { useThemeContext } from '@renderer/store/ThemeContext';
import { Select } from '@renderer/components/UI';

interface SettingProps {}

const themeOptions = [
  {
    label: 'Светлая',
    value: 'light',
  },
  {
    label: 'Темная',
    value: 'dark',
  },
];

export const Setting: React.FC<SettingProps> = () => {
  const { setTheme, theme } = useThemeContext();

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Настройки
      </h3>

      <div className="px-4">
        <div>
          Тема
          <Select
            options={themeOptions}
            value={themeOptions.find((o) => o.value === theme)}
            onChange={({ value }: any) => setTheme(value)}
            isSearchable={false}
          />
        </div>
      </div>
    </section>
  );
};
