import React, { useRef, useState } from 'react';

import { Select } from '@renderer/components/UI';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { TextInput } from '../Modal/TextInput';

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
  const compilerRef = useRef<HTMLInputElement>(null);
  const handleCompileConnect = () => {
    console.log(compilerRef?.current?.value);
  };
  const handleCompileReset = () => {
    if (compilerRef.current != undefined || compilerRef.current != null) {
      compilerRef.current.value = '';
    }
  };
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
        <br></br>
        Адрес компилятора
        <div>
          <TextInput
            label=""
            //placeholder="Напишите адрес компилятора"
            isElse={false}
            error={false}
            errorMessage={''}
            ref={compilerRef}
            //onChange={handleSubmit}
            //defaultValue={localStorage.getItem(localStorageHost) ?? ''}
          />
          <button className="btn-primary mb-4" onClick={handleCompileConnect}>
            {'A'}
          </button>
          <button className="btn-primary mb-4" onClick={handleCompileReset}>
            {'B'}
          </button>
        </div>
        Адрес док-сервера
        <div>
          <TextInput
            label=""
            //{...register('host')}
            //placeholder="Напишите адрес компилятора"
            isElse={false}
            error={false}
            errorMessage={''}
            //defaultValue={localStorage.getItem(localStorageHost) ?? ''}
          />
        </div>
      </div>
    </section>
  );
};
