import React, { Dispatch, useMemo, useState } from 'react';

import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as MenuIcon } from '@renderer/assets/icons/document.svg';
import { ReactComponent as DocumentationIcon } from '@renderer/assets/icons/documentation.svg';
import { ReactComponent as FlasherIcon } from '@renderer/assets/icons/flasher.svg';
import { ReactComponent as HistoryIcon } from '@renderer/assets/icons/history.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state_machine.svg';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { useModelContext } from '@renderer/store/ModelContext';
import { useDoc } from '@renderer/store/useDoc';
import { CompilerResult } from '@renderer/types/CompilerTypes';

import { CompilerTab } from './Compiler';
import { Explorer } from './Explorer';
import { Loader } from './Flasher/Flasher';
import { History } from './History';
import { Labels } from './Labels';
import { Menu } from './Menu';
import { Menus } from './Menus';
import { Setting } from './Setting';
import { StateMachinesList } from './StateMachinesTab/StateMachinesList';

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
  onRequestImportFile: (
    setOpenData: Dispatch<[boolean, string | null, string | null, string]>
  ) => void;
}

interface SidebarProps {
  callbacks: SidebarCallbacks;
  openImportError: (error: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  callbacks: {
    onRequestNewFile,
    onRequestOpenFile,
    onRequestSaveFile,
    onRequestSaveAsFile,
    onRequestImportFile,
  },
  openImportError,
}) => {
  const modelController = useModelContext();

  const [isCompilerOpen, openCompilerSettings, closeCompilerSettings] = useModal(false);
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const [isFlasherOpen, openFlasherSettings, closeFlasherSettings] = useModal(false);
  const [isAvrdudeGuideModalOpen, openAvrdudeGuideModal, closeAvrdudeGuideModal] = useModal(false);
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState('Не подключен.');
  const [onDocumentationToggle, isDocOpen] = useDoc((state) => [
    state.onDocumentationToggle,
    state.isOpen,
  ]);

  const isEditorDataStale = modelController.model.useData('', 'isStale');

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

    setFlasherSetting({ ...flasherSetting, ...data });
  };

  // при добавлении новой вкладки или изменения их расположения нужно обновить SidebarIndex из useSidebar
  const menus = useMemo(
    () => [
      <Menu
        onRequestNewFile={onRequestNewFile}
        onRequestOpenFile={onRequestOpenFile}
        onRequestSaveFile={onRequestSaveFile}
        onRequestSaveAsFile={onRequestSaveAsFile}
        onRequestImport={onRequestImportFile}
        compilerStatus={compilerStatus}
        setOpenData={setOpenData}
      />,
      <StateMachinesList />,
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
      undefined,
      <Setting
        openCompilerSettings={openCompilerSettings}
        openLoaderSettings={openLoaderSettings}
      />,
    ],
    [
      onRequestSaveFile,
      onRequestImportFile,
      onRequestNewFile,
      onRequestOpenFile,
      onRequestSaveAsFile,
      compilerData,
      openData,
      compilerStatus,
    ]
  );

  const tabLabels = useMemo(
    () => [
      {
        Icon: (
          <Badge show={isEditorDataStale}>
            <MenuIcon />
          </Badge>
        ),
        hint: isEditorDataStale ? 'Документ (не сохранён)' : 'Документ',
      },
      {
        Icon: <StateIcon />,
        hint: 'Машины состояний',
      },
      {
        Icon: <ComponentsIcon />,
        hint: 'Диаграмма',
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
        Icon: <DocumentationIcon />,
        hint: 'Документация',
        action: () => onDocumentationToggle(),
        isActive: isDocOpen,
      },
      {
        Icon: <SettingsIcon />,
        hint: 'Настройки',
      },
    ],
    [isEditorDataStale, isDocOpen]
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
