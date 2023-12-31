import React, { useMemo, useState } from 'react';

import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as FlasherIcon } from '@renderer/assets/icons/flasher.svg';
import { ReactComponent as HistoryIcon } from '@renderer/assets/icons/history.svg';
import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { CompilerResult } from '@renderer/types/CompilerTypes';

import { CompilerTab } from './Compiler';
import { Explorer } from './Explorer';
import { History } from './History';
import { Labels } from './Labels';
import { Loader } from './Loader';
import { Menu } from './Menu';
import { Menus } from './Menus';
import { Setting } from './Setting';

import { Badge } from '../UI';

export interface SidebarCallbacks {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
}

interface SidebarProps {
  editor: CanvasEditor | null;
  manager: EditorManager;
  callbacks: SidebarCallbacks;
  openImportError: (error: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  editor,
  manager,
  callbacks: { onRequestNewFile, onRequestOpenFile, onRequestSaveFile, onRequestSaveAsFile },
  openImportError,
}) => {
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState('Не подключен.');

  const isEditorDataStale = manager.useData('isStale');

  const handleImport = async () => {
    await manager.files.import(setOpenData);
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
        manager={manager}
      />,
      <Explorer editor={editor} manager={manager} />,
      <CompilerTab
        manager={manager}
        editor={editor}
        openData={openData}
        compilerData={compilerData}
        setCompilerData={setCompilerData}
        compilerStatus={compilerStatus}
        setCompilerStatus={setCompilerStatus}
        openImportError={openImportError}
      />,
      <Loader compilerData={compilerData} />,
      <History editor={editor} />,
      <Setting />,
    ],
    [manager, editor, compilerData, openData, compilerStatus]
  );

  const tabLabels = useMemo(
    () => [
      {
        Icon: (
          <Badge show={isEditorDataStale}>
            <MenuIcon />
          </Badge>
        ),
        hint: 'Меню',
      },
      {
        Icon: <ComponentsIcon />,
        hint: 'Компоненты',
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
    </div>
  );
};
