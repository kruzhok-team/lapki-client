import React, { useRef, useState } from 'react';

import { Select } from '@renderer/components/UI';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { Settings, CompilerSettings } from '../Modules/Settings';
import { Compiler } from '../Modules/Compiler';
import { ServerSelectModal } from '../ServerSelectModal';
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

  const [isCompilerModalOpen, setIsCompilerModalOpen] = useState(false);
  const openCompilerModal = () => setIsCompilerModalOpen(true);
  const closeCompilerModal = () => {
    //Flasher.freezeReconnectionTimer(false);
    setIsCompilerModalOpen(false);
  };

  // ссылки для хранения значений хоста и порта

  const compilerHostRef = useRef<HTMLInputElement>(null);
  const compilerPortRef = useRef<HTMLInputElement>(null);

  function setCompilerHost(host: string) {
    if (compilerHostRef.current != null) {
      compilerHostRef.current.value = host;
    }
  }

  function setCompilerPort(port: number | string) {
    if (compilerPortRef.current != null) {
      compilerPortRef.current.value = String(port);
    }
  }

  // подключение к серверу компилятора
  const handleCompileConnect = () => {
    if (
      compilerHostRef.current == undefined ||
      compilerHostRef.current == null ||
      compilerPortRef.current == undefined ||
      compilerPortRef.current == null
    ) {
      return;
    }
    let host: string = compilerHostRef?.current?.value;
    let port: number = Number(compilerPortRef?.current!.value);
    console.log(host, port);
    Settings.setCompilerSettings({ host, port } as CompilerSettings);
    Compiler.close();
    Compiler.connect(host, port);
  };
  // возвращение значений порта и хоста на те, что по-умолчанию
  const handleCompileReset = () => {
    setCompilerHost(window.api.DEFAULT_COMPILER_HOST);
    setCompilerPort(window.api.DEFAULT_COMPILER_PORT);
  };
  const handleCompilerHostChange = () => {
    //Flasher.freezeReconnectionTimer(true);
    openCompilerModal();
  };

  const handleDefaultCompiler = () => {
    console.log('DEFAULT', window.api.DEFAULT_COMPILER_HOST, window.api.DEFAULT_COMPILER_PORT);
    //handleCompileReset();
    //handleCompileConnect();
  };
  const handleCustomCompiler = (host: string, port: number) => {
    console.log('CUSTOM', host, port);
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
        <div>
          <button className="btn-primary mb-2" onClick={handleCompilerHostChange}>
            {' '}
            Компилятор
          </button>
        </div>
        <div>
          <button className="btn-primary mb-2"> Док-сервер</button>
        </div>
      </div>
      <ServerSelectModal
        isOpen={isCompilerModalOpen}
        handleDefault={handleDefaultCompiler}
        handleCustom={handleCustomCompiler}
        onClose={closeCompilerModal}
        topTitle={'Выберите компилятор'}
        textSelectTitle={'Компилятор'}
        defaultTitle={'Стандартный'}
        customTitle={'Пользовательский'}
        customHostValue={null}
        customPortValue={null}
      />
    </section>
  );
};
