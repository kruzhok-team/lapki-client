import React, { useMemo, useState } from 'react';

import { Explorer, Menu, CompilerTab, Loader, ExplorerCallbacks } from '../../components';

import { ReactComponent as MenuIcon } from '@renderer/assets/icons/menu.svg';
import { ReactComponent as ComponentsIcon } from '@renderer/assets/icons/components.svg';
import { ReactComponent as CompilerIcon } from '@renderer/assets/icons/compiler.svg';
import { ReactComponent as DriveIcon } from '@renderer/assets/icons/drive.svg';
import { ReactComponent as SettingsIcon } from '@renderer/assets/icons/settings.svg';
import { Setting } from '../Setting';
import { EditorRef } from '@renderer/hooks/useEditorManager';

import { Labels } from './Labels';
import { Menus } from './Menus';
import { Badge } from '../UI';
import { CompilerResult } from '@renderer/types/CompilerTypes';

export interface SidebarCallbacks {
  onRequestNewFile: () => void;
  onRequestOpenFile: () => void;
  onRequestSaveFile: () => void;
  onRequestSaveAsFile: () => void;
  onRequestAddComponent: () => void;
  onRequestEditComponent: (idx: string) => void;
  onRequestDeleteComponent: (name: string) => void;
}

interface SidebarProps {
  editorRef: EditorRef;
  callbacks: SidebarCallbacks;
}

export const Sidebar: React.FC<SidebarProps> = ({
  editorRef,
  callbacks: {
    onRequestNewFile,
    onRequestOpenFile,
    onRequestSaveFile,
    onRequestSaveAsFile,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  },
}) => {
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const [compilerData, setCompilerData] = useState<CompilerResult | undefined>(undefined);
  const [compilerStatus, setCompilerStatus] = useState('Не подключен.');

  const handleImport = async (platform: string) => {
    await editorRef.managerRef.current?.import(platform, setOpenData);
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
      <Explorer
        editorRef={editorRef}
        callbacks={{
          onRequestAddComponent,
          onRequestEditComponent,
          onRequestDeleteComponent,
        }}
      />,
      <CompilerTab
        manager={editorRef.managerRef.current}
        editor={editorRef.editor}
        editorData={editorRef.editorData}
        openData={openData}
        compilerData={compilerData}
        setCompilerData={setCompilerData}
        compilerStatus={compilerStatus}
        setCompilerStatus={setCompilerStatus}
      />,
      <Loader manager={editorRef.managerRef.current} compilerData={compilerData} />,
      <Setting />,
    ],
    [editorRef]
  );

  const tabLabels = useMemo(
    () => [
      {
        Icon: (
          <Badge show={editorRef.editorData.modified}>
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
    [editorRef.editorData]
  );

  return (
    <div className="flex">
      <Labels items={tabLabels} />
      <Menus items={menus} />
    </div>
  );
};
