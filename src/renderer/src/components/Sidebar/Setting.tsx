import React, { useState } from 'react';

import { Select } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { useThemeContext } from '@renderer/store/ThemeContext';

import { AboutTheProgramModal } from '../AboutTheProgramModal';
import { setURL } from '../Documentation/Documentation';
import { Compiler } from '../Modules/Compiler';
import { Settings, CompilerSettings, DocSettings } from '../Modules/Settings';
import { DocSelectModal } from '../serverSelect/DocSelectModal';
import { ServerSelectModal } from '../serverSelect/ServerSelectModal';
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
  // TODO: было неплохо, если бы загрузка параметов для модалок док-сервера и компилятора происходила бы здесь, а не внутри самих модалок, но код ниже не может этого сделать, до того как инициализируются эти модалки
  /*const [compilerSettings, setCompilerSettings] = useState<CompilerSettings>();
  const [docSettings, setDocSettings] = useState<DocSettings>();
  useEffect(() => {
    Settings.getCompilerSettings().then((compiler) => {
      setCompilerSettings(compiler);
    });
    Settings.getDocSettings().then((doc) => {
      setDocSettings(doc);
    });
  }, []);*/

  const { setTheme, theme } = useThemeContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  // для док-сервера

  const [isDocOpen, openDoc, closeDoc] = useModal(false);

  // подключение к серверу документации
  const handleDocConnect = async (host: string) => {
    console.log('HOST CONNECTING', host);
    await Settings.setDocSettings({ host } as DocSettings);
    setURL(host);
  };
  // действие при нажатии кнопки меню выбора сервера документации
  const handleDocHostChange = () => {
    //Flasher.freezeReconnectionTimer(true);
    openDoc();
  };

  // для компилятора

  const [isCompilerOpen, openCompiler, closeCompiler] = useModal(false);

  // подключение к серверу компилятора
  const handleCompileConnect = async (host: string, port: number) => {
    console.log('COMPILER CONNECTING', host, port);
    await Settings.setCompilerSettings({ host, port } as CompilerSettings);
    await Compiler.connect(host, port);
  };
  // действие при нажатии кнопки меню выбора сервера компилятора
  const handleCompilerHostChange = () => {
    //Flasher.freezeReconnectionTimer(true);
    openCompiler();
  };

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Настройки
      </h3>

      <div className="flex flex-col px-4">
        <div className="mb-4">
          Тема
          <Select
            options={themeOptions}
            value={themeOptions.find((o) => o.value === theme)}
            onChange={({ value }: any) => setTheme(value)}
            isSearchable={false}
          />
        </div>
        <br></br>
        <button className="btn-primary mb-2" onClick={handleCompilerHostChange}>
          Компилятор…
        </button>
        <button className="btn-primary mb-2" onClick={handleDocHostChange}>
          Док-сервер…
        </button>
        <br></br>
        <button className="btn-primary mb-2" onClick={() => setIsModalOpen(true)}>
          О программе
        </button>
      </div>
      <ServerSelectModal
        isOpen={isCompilerOpen}
        handleCustom={handleCompileConnect}
        onClose={closeCompiler}
        topTitle={'Выберите компилятор'}
        textSelectTitle={'Компилятор'}
        originaltHostValue={window.api.DEFAULT_COMPILER_SETTINGS.host}
        originaltPortValue={window.api.DEFAULT_COMPILER_SETTINGS.port.toString()}
        electronSettingsKey={window.api.COMPILER_SETTINGS_KEY}
      />

      <DocSelectModal
        isOpen={isDocOpen}
        handleCustom={handleDocConnect}
        onClose={closeDoc}
        topTitle={'Выберите док-сервер'}
        originaltHostValue={window.api.DEFAULT_DOC_SETTINGS.host}
        electronSettingsKey={window.api.DOC_SETTINGS_KEY}
      />

      <AboutTheProgramModal isOpen={isModalOpen} onClose={closeModal} />
    </section>
  );
};
