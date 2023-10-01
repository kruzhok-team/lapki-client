import React, { useMemo, useState } from 'react';

import { Explorer, Menu, CompilerTab, Loader } from '../../components';

import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as DriveIcon } from '@renderer/assets/icons/drive.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { Setting } from '../Setting';

import { Labels } from './Labels';
import { Menus } from './Menus';
import { Badge } from '../UI';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  editor,
  manager,
  callbacks: { onRequestNewFile, onRequestOpenFile, onRequestSaveFile, onRequestSaveAsFile },
}) => {
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState('Не подключен.');

  const isEditorDataStale = manager.useData('isStale');

  const handleImport = async (platform: string) => {
    await manager.import(platform, setOpenData);
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
      <Explorer editor={editor} manager={manager} />,
      <CompilerTab
        manager={manager}
        editor={editor}
        openData={openData}
        compilerData={compilerData}
        setCompilerData={setCompilerData}
        compilerStatus={compilerStatus}
        setCompilerStatus={setCompilerStatus}
      />,
      <Loader manager={manager} compilerData={compilerData} />,
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
      },
      {
        Icon: <ComponentsIcon />,
      },
      {
        Icon: <CompilerIcon />,
      },
      {
        Icon: <DriveIcon />,
      },
      {
        Icon: <SettingsIcon />,
        bottom: true,
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
