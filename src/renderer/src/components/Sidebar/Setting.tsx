import React from 'react';

import { Select } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { useThemeContext } from '@renderer/store/ThemeContext';

import { AboutTheProgramModal } from '../AboutTheProgramModal';
import { DocSelectModal } from '../serverSelect/DocSelectModal';
import { ServerSelectModal } from '../serverSelect/ServerSelectModal';

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

export const Setting: React.FC = () => {
  const { setTheme, theme } = useThemeContext();

  const [compilerSetting, setCompilerSetting, resetCompilerSetting] = useSettings('compiler');
  const [docSetting, setDocSetting, resetDocSetting] = useSettings('doc');

  const [isCompilerOpen, openCompiler, closeCompiler] = useModal(false);
  const [isDocModalOpen, openDocModal, closeDocModal] = useModal(false);
  const [isAboutModalOpen, openAboutModal, closeAboutModal] = useModal(false);

  const handleDocSubmit = (host: string) => {
    setDocSetting({ host });
  };

  const handleCompileSubmit = (host: string, port: number) => {
    setCompilerSetting({ host, port });
  };

  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Настройки
      </h3>

      <div className="flex flex-col gap-2 px-4">
        <div className="mb-4">
          Тема
          <Select
            options={themeOptions}
            value={themeOptions.find((o) => o.value === theme)}
            onChange={({ value }: any) => setTheme(value)}
            isSearchable={false}
          />
        </div>
        <button className="btn-primary" onClick={openCompiler}>
          Компилятор…
        </button>
        <button className="btn-primary mb-2" onClick={openDocModal}>
          Док-сервер…
        </button>
        <button className="btn-primary" onClick={openAboutModal}>
          О программе
        </button>
      </div>

      {compilerSetting && (
        <ServerSelectModal
          isOpen={isCompilerOpen}
          onSubmit={handleCompileSubmit}
          onClose={closeCompiler}
          onReset={resetCompilerSetting}
          defaultHostValue={compilerSetting.host}
          defaultPortValue={compilerSetting.port.toString()}
        />
      )}

      {docSetting && (
        <DocSelectModal
          isOpen={isDocModalOpen}
          onSubmit={handleDocSubmit}
          onReset={resetDocSetting}
          onClose={closeDocModal}
          defaultHostValue={docSetting.host}
        />
      )}

      <AboutTheProgramModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
    </section>
  );
};
