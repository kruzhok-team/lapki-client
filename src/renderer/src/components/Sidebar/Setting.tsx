import React from 'react';

import { Select, Switch } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { useModelContext } from '@renderer/store/ModelContext';
import { useFlasher } from '@renderer/store/useFlasher';

import { Autosave } from './AutosaveSetting';

import { AboutTheProgramModal } from '../AboutTheProgramModal';
import { ClientStatus } from '../Modules/Websocket/ClientStatus';
import { ResetSettingsModal } from '../ResetSettingsModal';
import { DocSelectModal } from '../serverSelect/DocSelectModal';

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

export interface SettingProps {
  openCompilerSettings: () => void;
  openLoaderSettings: () => void;
}

export const Setting: React.FC<SettingProps> = ({ openCompilerSettings, openLoaderSettings }) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;
  const isMounted = controller.useData('isMounted');
  const [theme, setTheme] = useSettings('theme');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');
  const { connectionStatus, isFlashing } = useFlasher();

  const [isDocModalOpen, openDocModal, closeDocModal] = useModal(false);
  const [isResetWarningOpen, openResetWarning, closeResetWarning] = useModal(false);
  const [isAboutModalOpen, openAboutModal, closeAboutModal] = useModal(false);
  const [isAutosaveModalOpen, openAutosaveModal, closeAutosaveModal] = useModal(false);

  const handleChangeTheme = ({ value }: any) => {
    setTheme(value);

    document.documentElement.dataset.theme = value;

    if (isMounted) {
      editor.view.isDirty = true;
    }
  };

  const handleChangeCanvasAnimations = (value: boolean) => {
    setCanvasSettings({
      ...canvasSettings!,
      animations: value,
    });
  };

  return (
    <section className="flex h-full flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Настройки
      </h3>

      {/* 44.8 - это высота заголовка сверху, а высота считается для того чтобы кнопка "О программе" была внизу */}
      <div className="flex h-[calc(100%-44.8px)] flex-col gap-2 px-4 pb-4">
        <div className="mb-4">
          <div className="mb-1">Тема</div>
          <Select
            options={themeOptions}
            value={themeOptions.find((o) => o.value === theme)}
            onChange={handleChangeTheme}
            isSearchable={false}
          />
        </div>

        <button className="btn-primary" onClick={openCompilerSettings}>
          Компилятор…
        </button>
        <button
          className="btn-primary"
          onClick={openLoaderSettings}
          disabled={connectionStatus === ClientStatus.CONNECTING || isFlashing}
        >
          Загрузчик…
        </button>
        <button className="btn-primary" onClick={openDocModal}>
          Документация…
        </button>
        <button className="btn-primary mb-4" onClick={openAutosaveModal}>
          Автосохранение...
        </button>
        <div className="mb-auto flex items-center gap-1">
          Анимации на холсте:
          <Switch
            checked={canvasSettings?.animations}
            onCheckedChange={handleChangeCanvasAnimations}
          />
        </div>

        <button className="btn-primary" onClick={openResetWarning}>
          Сбросить настройки
        </button>

        <button className="btn-primary" onClick={openAboutModal}>
          О программе
        </button>
      </div>

      <DocSelectModal isOpen={isDocModalOpen} onClose={closeDocModal} />
      <AboutTheProgramModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
      <ResetSettingsModal isOpen={isResetWarningOpen} onClose={closeResetWarning} />
      <Autosave isOpen={isAutosaveModalOpen} onClose={closeAutosaveModal} />
    </section>
  );
};
