import React, { useMemo, useState } from 'react';

import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as FlasherIcon } from '@renderer/assets/icons/flasher.svg';
import { ReactComponent as HistoryIcon } from '@renderer/assets/icons/history.svg';
import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';

import { CompilerTab } from './Compiler';
import { Explorer } from './Explorer';
import { History } from './History';
import { Labels } from './Labels';
import { Loader } from './Loader';
import { Menu } from './Menu';
import { Menus } from './Menus';
import { Setting } from './Setting';

import { AvrdudeGuideModal } from '../AvrdudeGuide';
import { Flasher } from '../Modules/Flasher';
import { CompilerSelectModal } from '../serverSelect/CompilerSelectModal';
import {
  FlasherSelectModal,
  FlasherSelectModalFormValues,
} from '../serverSelect/FlasherSelectModal';
import { Badge } from '../UI';

export interface SidebarCallbacks {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
}

interface SidebarProps {
  callbacks: SidebarCallbacks;
  openImportError: (error: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  callbacks: { onRequestNewFile, onRequestOpenFile, onRequestSaveFile, onRequestSaveAsFile },
  openImportError,
}) => {
  const { model } = useEditorContext();

  const [isCompilerOpen, openCompilerSettings, closeCompilerSettings] = useModal(false);
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const [isFlasherOpen, openFlasherSettings, closeFlasherSettings] = useModal(false);
  const [isAvrdudeGuideModalOpen, openAvrdudeGuideModal, closeAvrdudeGuideModal] = useModal(false);
  const [clearTabs, openTab] = useTabs((state) => [state.clearTabs, state.openTab]);
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState('Не подключен.');

  const isEditorDataStale = model.useData('isStale');

  const handleImport = async () => {
    await model.files.import(setOpenData);
    clearTabs();
    openTab({ type: 'editor', name: 'editor' });
  };

  const closeFlasherModal = () => {
    Flasher.freezeReconnectTimer(false);
    closeFlasherSettings();
  };

  const openLoaderSettings = () => {
    Flasher.freezeReconnectTimer(true);
    openFlasherSettings();
  };

  const handleFlasherModalSubmit = (data: FlasherSelectModalFormValues) => {
    if (!flasherSetting) return;

    Flasher.setAutoReconnect(data.type === 'remote');
    setFlasherSetting({ ...flasherSetting, ...data });
  };

  const menus = useMemo(
    () => [
      <Menu
        onRequestNewFile={onRequestNewFile}
        onRequestOpenFile={onRequestOpenFile}
        onRequestSaveFile={onRequestSaveFile}
        onRequestSaveAsFile={onRequestSaveAsFile}
        onRequestImport={handleImport}
        compilerStatus={compilerStatus}
      />,
      <Explorer />,
      <CompilerTab
        openData={openData}
        openCompilerSettings={openCompilerSettings}
        compilerData={compilerData}
        setCompilerData={setCompilerData}
        compilerStatus={compilerStatus}
        setCompilerStatus={setCompilerStatus}
        openImportError={openImportError}
      />,
      <Loader
        compilerData={compilerData}
        openLoaderSettings={openLoaderSettings}
        openAvrdudeGuideModal={openAvrdudeGuideModal}
      />,
      <History />,
      <Setting
        openCompilerSettings={openCompilerSettings}
        openLoaderSettings={openLoaderSettings}
      />,
    ],
    [compilerData, openData, compilerStatus]
  );

  const tabLabels = useMemo(
    () => [
      {
        Icon: (
          <Badge show={isEditorDataStale}>
            <MenuIcon />
          </Badge>
        ),
        hint: 'Документ',
      },
      {
        Icon: <ComponentsIcon />,
        hint: 'Проводник',
      },
      {
        Icon: <CompilerIcon />,
        hint: 'Компилятор',
      },
      {
        Icon: <FlasherIcon />,
        hint: 'Загрузчик',
      },
      {
        Icon: <HistoryIcon />,
        hint: 'История изменений',
        bottom: true,
      },
      {
        Icon: <SettingsIcon />,
        hint: 'Настройки',
      },
    ],
    [isEditorDataStale]
  );

  return (
    <div className="flex">
      <Labels items={tabLabels} />
      <Menus items={menus} />

      <FlasherSelectModal
        isOpen={isFlasherOpen}
        onSubmit={handleFlasherModalSubmit}
        onClose={closeFlasherModal}
      />
      <CompilerSelectModal isOpen={isCompilerOpen} onClose={closeCompilerSettings} />
      <AvrdudeGuideModal isOpen={isAvrdudeGuideModalOpen} onClose={closeAvrdudeGuideModal} />
    </div>
  );
};
