import React, { Dispatch, useEffect, useMemo, useState } from 'react';

import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as MenuIcon } from '@renderer/assets/icons/document.svg';
import { ReactComponent as DocumentationIcon } from '@renderer/assets/icons/documentation.svg';
import { ReactComponent as FlasherIcon } from '@renderer/assets/icons/flasher.svg';
import { ReactComponent as HistoryIcon } from '@renderer/assets/icons/history.svg';
import { ReactComponent as SerialMonitorIcon } from '@renderer/assets/icons/serial_monitor.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { useSettings } from '@renderer/hooks';
import { useFlasherHooks } from '@renderer/hooks/useFlasherHooks';
import { useModal } from '@renderer/hooks/useModal';
import { useModelContext } from '@renderer/store/ModelContext';
import { useDoc } from '@renderer/store/useDoc';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';

import { CompilerTab } from './Compiler';
import { Explorer } from './Explorer';
import { History } from './History';
import { Labels } from './Labels';
import { Menu } from './Menu';
import { Menus } from './Menus';
import { Setting } from './Setting';

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

const flasherTabName = 'Загрузчик';
const monitorTabName = 'Монитор порта';

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

  useFlasherHooks();

  const [isCompilerOpen, openCompilerSettings, closeCompilerSettings] = useModal(false);
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const [isFlasherSettingsOpen, openFlasherSettings, closeFlasherSettings] = useModal(false);
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState('Не подключен.');
  const { setCompilerData: setCompilerDataMS } = useManagerMS();
  const [onDocumentationToggle, isDocOpen] = useDoc((state) => [
    state.onDocumentationToggle,
    state.isOpen,
  ]);
  const [openTab, tabs] = useTabs((state) => [state.openTab, state.items]);
  const isFlasherTabOpen = tabs.find((tab) => tab.name === flasherTabName) !== undefined;
  const isSerialMonitorTabOpen = tabs.find((tab) => tab.name === monitorTabName) !== undefined;

  const isEditorDataStale = modelController.model.useData('', 'isStale');

  // TODO: костыль
  useEffect(() => {
    setCompilerDataMS(compilerData);
  }, [compilerData, setCompilerDataMS]);

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

  const handleFlasherClick = () => {
    openTab(modelController, {
      type: 'managerMS',
      name: flasherTabName,
    });
  };

  // добавление вкладки с serial monitor
  // пока клиент может мониторить только один порт
  const handleSerialMonitorClick = () => {
    openTab(modelController, {
      type: 'serialMonitor',
      name: monitorTabName,
      isOpen: isSerialMonitorTabOpen,
    });
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
      <Explorer />,
      <CompilerTab
        openData={openData}
        compilerData={compilerData}
        setCompilerData={setCompilerData}
        compilerStatus={compilerStatus}
        setCompilerStatus={setCompilerStatus}
        openImportError={openImportError}
      />,
      null,
      null,
      <History />,
      null,
      <Setting
        openCompilerSettings={openCompilerSettings}
        openLoaderSettings={openLoaderSettings}
      />,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        Icon: <ComponentsIcon />,
        hint: 'Диаграмма',
      },
      {
        Icon: <CompilerIcon />,
        hint: 'Компилятор',
      },
      {
        Icon: <FlasherIcon />,
        hint: flasherTabName,
        action: handleFlasherClick,
        isActive: isFlasherTabOpen,
      },
      {
        Icon: <SerialMonitorIcon />,
        hint: monitorTabName,
        action: handleSerialMonitorClick,
        isActive: isSerialMonitorTabOpen,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditorDataStale, isDocOpen, isFlasherTabOpen, isSerialMonitorTabOpen]
  );

  return (
    <div className="flex">
      <Labels items={tabLabels} />
      <Menus items={menus} />

      <FlasherSelectModal
        isOpen={isFlasherSettingsOpen}
        onSubmit={handleFlasherModalSubmit}
        onClose={closeFlasherModal}
      />
      <CompilerSelectModal isOpen={isCompilerOpen} onClose={closeCompilerSettings} />
    </div>
  );
};
