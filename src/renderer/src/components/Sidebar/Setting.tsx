import React from 'react';

import { Select, Switch } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { useEditorContext } from '@renderer/store/EditorContext';

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
  const editor = useEditorContext();
  const isMounted = editor.manager.useData('isMounted');
  const [theme, setTheme] = useSettings('theme');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');

  const [isCompilerOpen, openCompiler, closeCompiler] = useModal(false);
  const [isDocModalOpen, openDocModal, closeDocModal] = useModal(false);
  const [isAboutModalOpen, openAboutModal, closeAboutModal] = useModal(false);

  const handleChangeTheme = ({ value }: any) => {
    setTheme(value);

    document.documentElement.dataset.theme = value;

    if (isMounted) {
      editor.container.isDirty = true;
    }
  };

  const handleChangeCanvasAnimations = (value: boolean) => {
    setCanvasSettings({ animations: value });
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
        <button className="btn-primary mb-4" onClick={openDocModal}>
          Док-сервер…
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
      <DocSelectModal isOpen={isDocModalOpen} onClose={closeDocModal} />
      <AboutTheProgramModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
    </section>
  );
};
