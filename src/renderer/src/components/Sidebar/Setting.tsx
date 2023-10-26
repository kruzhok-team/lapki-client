import React, { useRef, useState } from 'react';

import { Select } from '@renderer/components/UI';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { TextInput } from '../Modal/TextInput';
import { Settings } from '../Modules/Settings';

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

  const compilerHostRef = useRef<HTMLInputElement>(null);
  const compilerPortRef = useRef<HTMLInputElement>(null);
  const handleCompileConnect = () => {
    console.log(compilerHostRef?.current?.value, compilerPortRef?.current?.value);
  };
  const handleCompileReset = () => {
    Settings.getCompilerSettings().then((compiler) => {
      if (
        compilerHostRef.current != undefined &&
        compilerHostRef.current != null &&
        compilerPortRef.current != undefined &&
        compilerPortRef.current != null
      ) {
        compilerHostRef.current.value = compiler.host;
        compilerPortRef.current.value = String(compiler.port);
      }
      console.log(compiler.host, compiler.port);
    });
  };
  /*const defaultAddress = () => {
    Settings.getCompilerSettings().then((compiler) => {
      return compiler.host
    }
  }*/
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
        <div>
          <TextInput
            label="Хост"
            isElse={false}
            error={false}
            errorMessage={''}
            ref={compilerHostRef}
            //defaultValue={localStorage.getItem(localStorageHost) ?? ''}
          />
          <TextInput
            label="Порт"
            isElse={false}
            error={false}
            errorMessage={''}
            ref={compilerPortRef}
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
