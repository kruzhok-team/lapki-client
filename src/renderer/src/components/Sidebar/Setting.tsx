import React from 'react';

import { Select, Switch } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { useFlasher } from '@renderer/hooks/useFlasher';
import { useModal } from '@renderer/hooks/useModal';
import { useEditorContext } from '@renderer/store/EditorContext';

import { AboutTheProgramModal } from '../AboutTheProgramModal';
import { FLASHER_CONNECTING, Flasher } from '../Modules/Flasher';
import { DocSelectModal } from '../serverSelect/DocSelectModal';
import {
  FlasherSelectModal,
  FlasherSelectModalFormValues,
} from '../serverSelect/FlasherSelectModal';
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
  const editor = useEditorContext();
  const isMounted = editor.model.useData('isMounted');
  const [theme, setTheme] = useSettings('theme');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const { connectionStatus, flashing } = useFlasher();
  const [isCompilerOpen, openCompiler, closeCompiler] = useModal(false);
  const [isFlasherOpen, openFlasher, closeFlasher] = useModal(false);
  const [isDocModalOpen, openDocModal, closeDocModal] = useModal(false);
  const [isAboutModalOpen, openAboutModal, closeAboutModal] = useModal(false);

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

  const handleHostChange = () => {
    Flasher.freezeReconnectionTimer(true);
    openFlasher();
  };
  const closeFlasherModal = () => {
    Flasher.freezeReconnectionTimer(false);
    closeFlasher();
  };

  const handleFlasherModalSubmit = (data: FlasherSelectModalFormValues) => {
    if (!flasherSetting) return;

    Flasher.setAutoReconnect(data.type === 'remote');
    setFlasherSetting({ ...flasherSetting, ...data });
  };

  return (
    <section className="flex h-full flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Настройки
      </h3>

      {/* 44.8 - это высота заголовка сверху, а высота считается для того чтобы кнопка "О программе" была внизу */}
      <div className="flex h-[calc(100%-44.8px)] flex-col gap-2 px-4 pb-4">
        <div className="mb-4">
          Тема
          <Select
            options={themeOptions}
            value={themeOptions.find((o) => o.value === theme)}
            onChange={handleChangeTheme}
            isSearchable={false}
          />
        </div>

        <button className="btn-primary" onClick={openCompiler}>
          Компилятор…
        </button>
        <button
          className="btn-primary mb-4"
          onClick={handleHostChange}
          disabled={connectionStatus == FLASHER_CONNECTING || flashing}
        >
          Загрузчик…
        </button>
        <button className="btn-primary mb-4" onClick={openDocModal}>
          Документация…
        </button>

        <div className="mb-auto flex items-center justify-between">
          Анимации на холсте
          <Switch
            checked={canvasSettings?.animations}
            onCheckedChange={handleChangeCanvasAnimations}
          />
        </div>

        <button className="btn-primary" onClick={openAboutModal}>
          О программе
        </button>
      </div>

      <ServerSelectModal isOpen={isCompilerOpen} onClose={closeCompiler} />
      <FlasherSelectModal
        isOpen={isFlasherOpen}
        onSubmit={handleFlasherModalSubmit}
        onClose={closeFlasherModal}
      />
      <DocSelectModal isOpen={isDocModalOpen} onClose={closeDocModal} />
      <AboutTheProgramModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
    </section>
  );
};
