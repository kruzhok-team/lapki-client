import React from 'react';

import { useSettings } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';
import { useFlasher } from '@renderer/store/useFlasher';

import { ClientStatus } from '../../Modules/Websocket/ClientStatus';
import { DropdownMenu, DropdownMenuItem } from '../../UI';

export interface SettingProps {
  openCompilerSettings: () => void;
  openAboutModal: () => void;
  openResetSettings: () => void;
  openLoaderSettings: () => void;
  openAutosaveSettings: () => void;
  openDocumentationSettings: () => void;
  onItemSelect?: () => void;
}

export const Setting: React.FC<SettingProps> = ({
  openCompilerSettings,
  openAboutModal,
  openResetSettings,
  openLoaderSettings,
  openAutosaveSettings,
  openDocumentationSettings,
  onItemSelect,
}) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;
  const isMounted = controller.useData('isMounted');
  const [theme, setTheme] = useSettings('theme');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');
  const { connectionStatus, isFlashing } = useFlasher();

  const handleChangeTheme = (value: 'light') => {
    setTheme(value);
    document.documentElement.dataset.theme = value;

    if (isMounted) {
      editor.view.isDirty = true;
    }

    onItemSelect?.();
  };

  const handleChangeCanvasAnimations = (value: boolean) => {
    if (!canvasSettings) return;

    setCanvasSettings({
      ...canvasSettings,
      animations: value,
    });
    onItemSelect?.();
  };

  const selectAndOpen = (open: () => void) => {
    onItemSelect?.();
    open();
  };

  return (
    <DropdownMenu>
      <div className="group relative">
        <DropdownMenuItem aria-haspopup="menu">Тема</DropdownMenuItem>
        <DropdownMenu className="dropdown-submenu">
          {(['light'] as const).map((value) => (
            <DropdownMenuItem
              key={value}
              role="menuitemradio"
              aria-checked={theme === value}
              onClick={() => handleChangeTheme(value)}
            >
              {value === 'light' ? 'Светлая' : 'Тёмная'}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      </div>

      <DropdownMenuItem onClick={() => selectAndOpen(openCompilerSettings)}>
        Компилятор
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => selectAndOpen(openLoaderSettings)}
        disabled={connectionStatus === ClientStatus.CONNECTING || isFlashing}
      >
        Загрузчик
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => selectAndOpen(openDocumentationSettings)}>
        Документация
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => selectAndOpen(openAutosaveSettings)}>
        Автосохранение
      </DropdownMenuItem>

      <div className="group relative">
        <DropdownMenuItem aria-haspopup="menu">Анимации на холсте</DropdownMenuItem>
        <DropdownMenu className="dropdown-submenu">
          <DropdownMenuItem
            role="menuitemradio"
            aria-checked={canvasSettings?.animations === true}
            onClick={() => handleChangeCanvasAnimations(true)}
          >
            Вкл
          </DropdownMenuItem>
          <DropdownMenuItem
            role="menuitemradio"
            aria-checked={canvasSettings?.animations === false}
            onClick={() => handleChangeCanvasAnimations(false)}
          >
            Выкл
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      <DropdownMenuItem onClick={() => selectAndOpen(openResetSettings)}>
        Сбросить настройки
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => selectAndOpen(openAboutModal)}>О программе</DropdownMenuItem>
    </DropdownMenu>
  );
};
