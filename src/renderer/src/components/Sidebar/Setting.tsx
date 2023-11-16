import React, { useState } from 'react';

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
    //Compiler.freezeReconnectionTimer(false);
    setIsCompilerModalOpen(false);
  };

  // подключение к серверу компилятора
  const handleCompileConnect = async (host: string, port: number) => {
    console.log('COMPILER CONNECTING', host, port);
    await Settings.setCompilerSettings({ host, port } as CompilerSettings);
    await Compiler.connect(host, port);
  };
  // действие при нажатии кнопки меню выбора сервера компилятора
  const handleCompilerHostChange = () => {
    //Flasher.freezeReconnectionTimer(true);
    openCompilerModal();
  };
  // подключение к серверу по-умолчанию
  const handleDefaultCompiler = async () => {
    console.log('DEFAULT', window.api.DEFAULT_COMPILER_HOST, window.api.DEFAULT_COMPILER_PORT);
    await handleCompileConnect(window.api.DEFAULT_COMPILER_HOST, window.api.DEFAULT_COMPILER_PORT);
  };
  // подключение к серверу компилятора
  const handleCustomCompiler = async (host: string, port: number) => {
    console.log('CUSTOM', host, port);
    await handleCompileConnect(host, port);
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
        customHostValue={Compiler.host}
        customPortValue={String(Compiler.port)}
      />
    </section>
  );
};
